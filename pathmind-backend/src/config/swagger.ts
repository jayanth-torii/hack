import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Vidhyora API",
      version: "1.0.0",
      description:
        "AI-generated, sequenced learning roadmaps — syllabus, free resources, certifications, practice links, and timelines, with server-enforced difficulty-aware unlock progression.",
    },
    servers: [{ url: "/", description: "Current server" }],
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "accessToken" },
      },
    },
  },
  apis: [path.join(__dirname, "..", "routes", "*.ts"), path.join(__dirname, "..", "routes", "*.js")],
};

export const swaggerSpec = swaggerJsdoc(options);
