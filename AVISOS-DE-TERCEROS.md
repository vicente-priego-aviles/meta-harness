# Avisos de terceros

meta-harness incluye material adaptado de proyectos de código abierto. Este archivo recoge, como piden sus licencias, de dónde sale cada parte, quién tiene sus derechos y con qué licencia se distribuye. Es el único lugar del repositorio donde se nombran esos proyectos y sus autores.

## Material adaptado
| Parte de meta-harness | Proyecto de origen | Versión | Licencia | Copyright |
|---|---|---|---|---|
| skill `brain` y `scripts/verificar_evidencias.py` | [Astro-Han/karpathy-llm-wiki](https://github.com/Astro-Han/karpathy-llm-wiki) | `eafcc77` | MIT | Copyright (c) 2026 Yuhan Lei |
| skills `obsidian-markdown` (y `references/sintaxis.md`), `obsidian-bases` y `defuddle` | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | `3ccff53` | MIT | Copyright (c) 2026 Steph Ango (@kepano) |
| skill `excalidraw` | [github/awesome-copilot](https://github.com/github/awesome-copilot), `skills/excalidraw-diagram-generator` | `b13e55f` | MIT | Copyright GitHub, Inc. |
| skills `git` y `release` | [github/awesome-copilot](https://github.com/github/awesome-copilot), skills de commits, ramas, comentarios de PR y releases (`git-commit`, `conventional-branch`, `gitmoji`, `pr-address-feedback`, `github-release`) | `227949a` | MIT | Copyright GitHub, Inc. |
| skill `interrogar` y reglas de reparto en tareas de la skill `asdd` | [mattpocock/skills](https://github.com/mattpocock/skills), `grilling` | `4ae2317` | MIT | Copyright (c) 2026 Matt Pocock |
| reglas de Mermaid de la skill `secuencia` | [mohitagw15856/pm-claude-skills](https://github.com/mohitagw15856/pm-claude-skills), `sequence-diagram` | `c88d23a` | MIT | Copyright (c) 2026 Mohit Aggarwal |
| reglas de Mermaid de la skill `secuencia` | [softaworks/agent-toolkit](https://github.com/softaworks/agent-toolkit), `mermaid-diagrams` | `3027f20` | MIT | Copyright (c) 2026 Leonardo Flores |
| `catalog/vendor/camunda/` (documentación oficial de Camunda, sin cambios) | [camunda/skills](https://github.com/camunda/skills) | `aa0f1cb` | Apache-2.0 (texto completo en `catalog/vendor/camunda/LICENSE`) | Copyright 2026 Camunda Services GmbH |
| tipografía de los diagramas de la guía web (`tools/fonts/`, incrustada en los SVG) | [Excalifont](https://github.com/excalidraw/excalidraw), del proyecto Excalidraw | `701b901` | SIL Open Font License 1.1 (texto completo en `tools/fonts/Excalifont-LICENCIA.txt`) | Copyright (c) 2024 by Excalidraw |

## Ideas e inspiración
Estos proyectos y textos inspiraron el diseño (carriles, hooks, memoria, formato de notas, ahorro de tokens). No se ha copiado su código; se citan por reconocimiento.

| Proyecto o texto | Qué aportó |
|---|---|
| [ericrisco/rsc-harness](https://github.com/ericrisco/rsc-harness) (MIT, `ba0e80d`) y los vídeos de su autor sobre factorías de software | los carriles FTD y ASDD, la cola de decisiones, la puerta de riesgo y la orientación al arrancar |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) (MIT, `d2ef268`) | instalador por manifiestos de módulos, `doctor` y desinstalación sin tocar archivos del usuario, y perfiles de hooks (`minimal`, `standard`, `strict`) |
| La idea de «LLM Wiki» de Andrej Karpathy | el brain como wiki que mantiene el modelo |
| *Effective harnesses for long-running agents*, de Anthropic | `init.sh`, el registro de progreso y la rutina de arranque |
| [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) | el formato de las notas (OKF) |
| [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | las mediciones sobre dónde se gastan los tokens |

## Texto de la licencia MIT
Se aplica a todo el material de la primera tabla marcado como MIT, con el aviso de copyright de su fila.

```text
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
