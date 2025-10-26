import http, { IncomingMessage, ServerResponse } from "http";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

export class HttpServer {
    private getRoutes: Map<string, Handler> = new Map();
    private postRoutes: Map<string, Handler> = new Map();
    private server?: http.Server; // store reference to the server

    get(path: string, handler: Handler) {
        this.getRoutes.set(path, handler);
    }

    post(path: string, handler: Handler) {
        this.postRoutes.set(path, handler);
    }

    private parseBody(req: IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            let body = "";
            req.on("data", (chunk) => (body += chunk.toString()));
            req.on("end", () => {
                try {
                    resolve(JSON.parse(body || "{}"));
                } catch {
                    resolve({});
                }
            });
            req.on("error", reject);
        });
    }

    listen(port: number, host: string = "0.0.0.0", callback?: () => void) {
        this.server = http.createServer(async (req, res) => {
            if (!req.url || !req.method) {
                throw new Error("Invalid request");
            }

            const method = req.method.toUpperCase();
            const url = req.url.split("?")[0];

            let handler: Handler | undefined;
            if (method === "GET") handler = this.getRoutes.get(url);
            if (method === "POST") handler = this.postRoutes.get(url);

            if (!handler) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Not Found" }));
                return;
            }

            if (method === "POST") {
                (req as any).body = await this.parseBody(req);
            }

            handler(req, res);
        });

        this.server.listen(port, host, callback);
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                reject(new Error("Server is not running"));
                return;
            }
            this.server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}
