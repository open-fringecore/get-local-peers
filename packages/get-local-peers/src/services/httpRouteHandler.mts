import http, { IncomingMessage, ServerResponse } from "http";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

export class App {
    private getRoutes: Map<string, Handler> = new Map();
    private postRoutes: Map<string, Handler> = new Map();

    get(path: string, handler: Handler) {
        this.getRoutes.set(path, handler);
    }

    post(path: string, handler: Handler) {
        this.postRoutes.set(path, handler);
    }

    private parseBody(req: IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                try {
                    resolve(JSON.parse(body || "{}"));
                } catch {
                    resolve({});
                }
            });
            req.on("error", (err) => reject(err));
        });
    }

    listen(port: number, callback?: () => void) {
        const server = http.createServer(async (req, res) => {
            if (!req.url || !req.method) {
                throw new Error("Invalid request");
            }

            const method = req.method.toUpperCase();
            const url = req.url.split("?")[0]; // ignore query params

            let handler: Handler | undefined;
            if (method === "GET") handler = this.getRoutes.get(url);
            if (method === "POST") handler = this.postRoutes.get(url);

            if (!handler) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Not Found" }));
                return;
            }

            // Attach parsed JSON body for POST
            if (method === "POST") {
                (req as any).body = await this.parseBody(req);
            }

            // Call the route handler
            handler(req, res);
        });

        server.listen(port, callback);
    }
}
