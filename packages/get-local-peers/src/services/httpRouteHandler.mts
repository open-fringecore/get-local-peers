import http, { IncomingMessage, ServerResponse } from "http";

type Handler = (
    req: IncomingMessage & { body?: any },
    res: ServerResponse & {
        json: (data: any, code?: number) => void;
        send: (data: any, code?: number) => void;
        status: (code: number) => ResponseHelper;
    }
) => void;

type ResponseHelper = {
    json: (data: any) => void;
    send: (data: any) => void;
};

export class HttpServer {
    private getRoutes: Map<string, Handler> = new Map();
    private postRoutes: Map<string, Handler> = new Map();
    private server?: http.Server;

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

            // extend res with helper methods
            (res as any).json = (data: any, code: number = 200) => {
                res.writeHead(code, { "Content-Type": "application/json" });
                res.end(JSON.stringify(data));
            };

            (res as any).send = (data: any, code: number = 200) => {
                if (typeof data === "object") {
                    res.writeHead(code, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(data));
                } else {
                    res.writeHead(code, { "Content-Type": "text/plain" });
                    res.end(data);
                }
            };

            (res as any).status = (code: number): ResponseHelper => {
                return {
                    json: (data: any) => {
                        res.writeHead(code, {
                            "Content-Type": "application/json",
                        });
                        res.end(JSON.stringify(data));
                    },
                    send: (data: any) => {
                        if (typeof data === "object") {
                            res.writeHead(code, {
                                "Content-Type": "application/json",
                            });
                            res.end(JSON.stringify(data));
                        } else {
                            res.writeHead(code, {
                                "Content-Type": "text/plain",
                            });
                            res.end(data);
                        }
                    },
                };
            };

            if (!handler) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Not Found" }));
                return;
            }

            if (method === "POST") {
                (req as any).body = await this.parseBody(req);
            }

            handler(req as any, res as any);
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
