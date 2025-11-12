export default async function handler(req, res) {
  const yaml = `
openapi: 3.1.0
info:
  title: SatMap Renderer
  version: "1.0"
servers:
  - url: /
paths:
  /api/render:
    post:
      operationId: renderSatMap
      summary: Genera una imagen satélite rotulada y la devuelve como PNG
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                lat:
                  type: number
                  description: Latitud en decimal
                lon:
                  type: number
                  description: Longitud en decimal
                zoom:
                  type: integer
                  minimum: 10
                  maximum: 20
                  default: 17
                labels:
                  type: array
                  items: { type: string }
                  description: Hasta 3 etiquetas (p.ej. "A-1", "M-50", "Parque Empresarial La Marina")
              required: [lat, lon]
      responses:
        "200":
          description: PNG con la imagen satélite rotulada
          content:
            image/png: {}
        "400":
          description: Parámetros inválidos
        "500":
          description: Error al generar
`;
  res.setHeader("Content-Type", "text/yaml; charset=utf-8");
  res.status(200).send(yaml);
}
