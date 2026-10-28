import express, { Request, Response } from "express";
import { readJSON, writeJSON } from "./db";
import * as os from "os";

const app = express();
app.use(express.json());

interface Articulo {
  id: number;
  titulo: string;
  contenido: string;
  autor: string;
  fecha: string;
}

const FILE = "articulos.json";

// ---------- Rutas heredadas de la Unidad 1 ----------
app.get("/saludo", (req: Request, res: Response) => {
  const nombre = (req.query.nombre as string) || "mundo";
  res.json({ mensaje: `Hola, ${nombre}!` });
});

app.get("/info", (_req, res) => {
  res.json({
    servicio: "blog.local",
    version: "1.0.0",
    so: process.platform,
    node: process.version,
    fecha: new Date().toISOString()
  });
});

app.get("/cotizacion", (_req, res) => {
  res.json({ moneda: "USD", compra: 8.75, venta: 8.85, fecha: new Date().toISOString() });
});

// ---------- CRUD de articulos (DB en JSON) ----------
app.get("/articulos", (_req, res) => {
  res.json(readJSON<Articulo[]>(FILE));
});

app.get("/articulos/:id", (req, res) => {
  const items = readJSON<Articulo[]>(FILE);
  const item = items.find((a) => a.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Articulo no encontrado" });
  res.json(item);
});

app.post("/articulos", (req, res) => {
  const items = readJSON<Articulo[]>(FILE);
  const nuevo: Articulo = {
    id: items.length ? Math.max(...items.map((a) => a.id)) + 1 : 1,
    titulo: req.body.titulo,
    contenido: req.body.contenido,
    autor: req.body.autor || "Anónimo",
    fecha: new Date().toISOString()
  };
  items.push(nuevo);
  writeJSON(FILE, items);
  res.status(201).json(nuevo);
});

app.put("/articulos/:id", (req, res) => {
  const items = readJSON<Articulo[]>(FILE);
  const idx = items.findIndex((a) => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Articulo no encontrado" });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  writeJSON(FILE, items);
  res.json(items[idx]);
});

app.delete("/articulos/:id", (req, res) => {
  const items = readJSON<Articulo[]>(FILE);
  const filtrados = items.filter((a) => a.id !== Number(req.params.id));
  if (filtrados.length === items.length)
    return res.status(404).json({ error: "Articulo no encontrado" });
  writeJSON(FILE, filtrados);
  res.status(204).send();
});

app.get("/health", (req, res) => {
    //Simular que si falla -> devuelve Error 503
    //http://localhost:9000/health?simular=falla
    if (req.query.simular === "falla") {
        return res.status(503).json({
            estado: "No Health",
            nodo: os.hostname(),
            timestamp: new Date().toISOString(),
            mensaje: "Simulador Fail"
        });
    }

    //Normalmente, aqui estaria la verificacion DB, Redis API externas etc
    res.status(200).json({
        estado: "Health",
        nodo: os.hostname(),
        timestamp: new Date().toISOString()
    });
});

// ---------- Arranque ----------
const PORT = Number(process.env.PORT) || 9000;
app.listen(PORT, () => {
  console.log(`blog.local escuchando en http://localhost:${PORT}`);
});