
import asyncio
import websockets
import ssl
import json

from websockets.asyncio.server import serve


ipaddr = '10.124.105.35'



ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile="/Users/yan/code/ynrng.github.io/code/motion/cert.pem", keyfile="/Users/yan/code/ynrng.github.io/code/motion/key.pem")



async def hello(websocket):
    while True:
        msg = await websocket.recv()
        print(msg)


async def main():
    async with serve(hello, ipaddr, 8080, ssl=ssl_context) as server:
        print(f"✅ WebSocket server listening on wss://{ipaddr}:8080")
        await server.serve_forever()

if __name__ == "__main__":
    asyncio.run(main())