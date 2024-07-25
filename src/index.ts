import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";

const app = express();
const port = process.env.PORT || 3000;

// Middleware para analisar o corpo das requisições como JSON
app.use(bodyParser.json());

// Middleware para analisar o corpo das requisições como application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

interface Quote {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}

let quotes: Quote[] = [];

// Endpoint para receber as cotações
app.post("/quote", (req: Request, res: Response) => {
  const quote: Quote = req.body;
  //console.log("Received quote:", quote); // Log para verificar o corpo da requisição

  // Validação básica dos dados recebidos
  if (
    typeof quote.open !== "number" ||
    typeof quote.high !== "number" ||
    typeof quote.low !== "number" ||
    typeof quote.close !== "number" ||
    typeof quote.time !== "string"
  ) {
    return res.status(400).send("Dados de cotação inválidos");
  }

  // Verificar se já existe uma cotação com o mesmo time
  const existingIndex = quotes.findIndex((q) => q.time === quote.time);
  if (existingIndex !== -1) {
    // Substituir o objeto existente
    quotes[existingIndex] = quote;
  } else {
    // Adicionar novo objeto e remover o mais antigo se necessário
    if (quotes.length >= 60) {
      quotes.shift(); // Remover o primeiro objeto
    }
    quotes.push(quote);
  }
  // Emitir a cotação via WebSocket
  io.emit("message", quote);

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

  socket.on("message", (message) => {
    console.log(`Mensagem recebida: ${message}`);
  });

  socket.on("disconnect", () => {
    console.log("Um cliente se desconectou");
  });
});

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
