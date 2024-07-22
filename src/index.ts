import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";

const app = express();
const port = process.env.PORT || 3000;

// Middleware para analisar o corpo das requisições como JSON
app.use(bodyParser.json());

interface Quote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

let quotes: Quote[] = [];

app.get("/acorda", (req: Request, res: Response) => {
  res.status(200).send("Acordei!");
});

// Endpoint para receber as cotações
app.post("/quote", (req: Request, res: Response) => {
  const quote: Quote = req.body;
  console.log(quote);

  // Adicionar validação e tratamento de erros conforme necessário
  if (
    !quote.symbol ||
    !quote.open ||
    !quote.high ||
    !quote.low ||
    !quote.close ||
    !quote.time
  ) {
    return res.status(400).send("Dados de cotação inválidos");
  }

  quotes.push(quote);

  // Emitir a cotação via WebSocket
  io.emit("new-quote", quote);

  res.status(200).send("Cotação recebida com sucesso");
});

// Configurar o servidor WebSocket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Um cliente se conectou");

  // Enviar as cotações armazenadas ao novo cliente
  socket.emit("initial-quotes", quotes);

  socket.on("disconnect", () => {
    console.log("Um cliente se desconectou");
  });
});

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
