# Formato de la especificación (`*.spec.json`)

```json
{
  "titulo": "Texto grande arriba a la izquierda (opcional)",
  "descripcion": "Texto que aparece en la nota antes del dibujo (opcional)",
  "tags": ["arquitectura"],
  "direccion": "LR",
  "maxCaracteres": 22,
  "nodos": [
    {"id": "brain", "texto": "Brain\n(Obsidian)", "color": "amarillo", "fila": 0, "col": 1},
    {"id": "spec",  "texto": "Spec ASDD", "forma": "rectangle", "color": "azul", "fila": 1, "col": 0},
    {"id": "riesgo","texto": "¿Riesgo 2?", "forma": "diamond", "color": "rojo", "fila": 1, "col": 2},
    {"id": "fuente","texto": "Nota", "enlace": "[[00-vision]]", "discontinuo": true, "fila": 2, "col": 0}
  ],
  "aristas": [
    {"de": "spec", "a": "brain", "texto": "consulta"},
    {"de": "brain", "a": "riesgo", "estilo": "discontinua", "doble": true}
  ],
  "grupos": [
    {"texto": "Capa de procesos", "nodos": ["spec", "riesgo"], "color": "gris"}
  ],
  "notas": [
    {"texto": "Comentario suelto", "fila": 3, "col": 0}
  ]
}
```

## Campos
| Campo | Obligatorio | Descripción |
|---|---|---|
| `nodos[].id` | sí | identificador único (se usa en aristas y grupos) |
| `nodos[].texto` | no | etiqueta; `\n` fuerza salto de línea (por defecto el id) |
| `nodos[].forma` | no | `rectangle` (defecto), `ellipse`, `diamond` |
| `nodos[].color` | no | `azul` (defecto), `verde`, `amarillo`, `rojo`, `morado`, `naranja`, `gris`, `blanco` |
| `nodos[].fila`, `col` | no | celda en la cuadrícula; si faltan, se colocan en línea según `direccion` |
| `nodos[].ancho`, `alto` | no | tamaño mínimo en px |
| `nodos[].enlace` | no | enlace Obsidian (`[[nota]]`) o URL |
| `nodos[].discontinuo` | no | borde discontinuo (opcional, aplazado, externo) |
| `aristas[].de`, `a` | sí | ids de nodo |
| `aristas[].texto` | no | etiqueta junto a la flecha, sin fondo y sin pisar la línea: encima si es horizontal, a la izquierda si es vertical, por fuera de la curva si es oblicua |
| `aristas[].curva` | no | arqueo de la flecha (fracción de su largo); por defecto 0,12 en las oblicuas y 0 en las rectas; positivo arquea hacia arriba, negativo hacia abajo |
| `aristas[].posTexto` | no | dónde va la etiqueta a lo largo de la flecha (0 = origen, 1 = destino; defecto 0,5) |
| `aristas[].estilo` | no | `discontinua` para relaciones débiles o futuras |
| `aristas[].doble` | no | punta en ambos extremos |
| `grupos[]` | no | marco discontinuo con título detrás de los nodos indicados |
| `leyenda` | no (recomendada) | lista de `{color, texto, forma?}`: fila de muestras bajo el dibujo con lo que significa cada color o forma en este diagrama |
| `direccion` | no | `LR` (izquierda→derecha, defecto) o `TB` (arriba→abajo) |
| `huecoX`, `huecoY` | no | separación extra entre celdas (defecto 90 / 80) |

## Consejos
- Un nodo por concepto; frases de 1–4 palabras.
- Agrupa por capas o responsables con `grupos`.
- Mantén las flechas en una dirección dominante; las de vuelta, `discontinua`.
- Si una etiqueta no cabe entre dos nodos, sube `huecoX`/`huecoY`; si una curva pisa un nodo, cambia el signo de `curva` o muévela con `posTexto`.
