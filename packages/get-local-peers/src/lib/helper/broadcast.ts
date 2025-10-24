import { Socket } from "dgram";

const broadcast = (
    server: Socket,
    ADDRESS: string,
    PORT: number,
    msg: string
): void => {
    const MESSAGE: Buffer = Buffer.from(msg);

    server.send(
        MESSAGE,
        0,
        MESSAGE.length,
        PORT,
        ADDRESS,
        (err: Error | null): void => {
            if (err) throw err;
            // console.log(`Broadcast sent to ${ADDRESS}:${PORT}`);
            // server.close();
        }
    );
};

export default broadcast;
