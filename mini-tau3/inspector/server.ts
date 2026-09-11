import { resolve, basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { createServer } from "vite"

export async function startInspector(file: string, { open = true }: { open?: boolean } = {}) {
  const document: unknown = JSON.parse(await Bun.file(resolve(file)).text())
  const payload = JSON.stringify({ title: basename(file), document })
  const server = await createServer({
    configFile: false,
    root: dirname(fileURLToPath(import.meta.url)),
    publicDir: false,
    server: { host: "127.0.0.1", port: 0 },
    plugins: [{
      name: "saved-run",
      configureServer(server) {
        server.middlewares.use("/run.json", (request, response) => {
          response.setHeader("Cache-Control", "no-store")
          response.setHeader("X-Content-Type-Options", "nosniff")
          if (request.method !== "GET") {
            response.statusCode = 405
            response.end("Method not allowed")
            return
          }
          response.setHeader("Content-Type", "application/json; charset=utf-8")
          response.end(payload)
        })
      },
    }],
  })
  await server.listen()
  const url = server.resolvedUrls?.local[0]
  if (!url) throw new Error("Could not start the local inspector.")
  console.log(`Inspecting ${file}\n${url}\nPress Ctrl+C to stop.`)
  if (open) {
    const command = process.platform === "darwin" ? ["open", url] : process.platform === "win32" ? ["rundll32", "url.dll,FileProtocolHandler", url] : ["xdg-open", url]
    const child = spawn(command[0]!, command.slice(1), { stdio: "ignore" })
    child.on("error", () => console.log(`Open ${url} in your browser.`))
  }
  const close = async () => { await server.close(); process.exit(0) }
  process.once("SIGINT", close)
  process.once("SIGTERM", close)
}
