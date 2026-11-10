"""Tests de catalog/skills/brain/scripts/verificar_evidencias.py.

Ejecutar: python3 -m unittest discover -s tests -t . -v
"""
import contextlib
import importlib.util
import io
import tempfile
import textwrap
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "verificar_evidencias", RAIZ / "catalog/skills/brain/scripts/verificar_evidencias.py")
ve = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ve)


def escribir(base, ruta, texto):
    p = base / ruta
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(textwrap.dedent(texto).lstrip(), encoding="utf-8")
    return p


def nota(sources, cuerpo, tipo="Concepto"):
    lineas = "\n".join(f"  - {{ resource: {s} }}" for s in sources)
    return f"---\ntype: {tipo}\nsources:\n{lineas}\n---\n\n{cuerpo}\n"


class VerificarEvidencias(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.b = Path(self.tmp.name)
        escribir(self.b, "raw/t/fuente.md",
                 'El estudio midió 4,500 tests y un ahorro del 0.3% el 2026-04-02. "La wiki es un artefacto persistente".')
        escribir(self.b, "wiki/index.md", "# Índice\n")
        escribir(self.b, "wiki/log.md", "# Registro\n")

    def tearDown(self):
        self.tmp.cleanup()

    def ejecutar(self, *notas):
        with contextlib.redirect_stdout(io.StringIO()) as out:
            r = ve.revisar(self.b, [str(n) for n in notas])
        return r, out.getvalue()

    def test_numeros_en_formato_espanol_coinciden(self):
        escribir(self.b, "wiki/t/a.md", nota(["../../raw/t/fuente.md"], "Hubo 4.500 tests y un 0,3 % de ahorro."))
        (sosp, err, _), _ = self.ejecutar()
        self.assertEqual((sosp, err), (0, 0))

    def test_numero_inventado_es_sospechoso(self):
        escribir(self.b, "wiki/t/a.md", nota(["../../raw/t/fuente.md"], "Hubo 7.200 tests."))
        (sosp, _, _), out = self.ejecutar()
        self.assertEqual(sosp, 1)
        self.assertIn("7.200", out)

    def test_cita_literal_se_verifica_y_parafrasis_no(self):
        escribir(self.b, "wiki/t/a.md", nota(["../../raw/t/fuente.md"],
                 'Dice "La wiki es un artefacto persistente" y «esto es una traducción libre larga».'))
        (sosp, _, _), _ = self.ejecutar()
        self.assertEqual(sosp, 0)
        escribir(self.b, "wiki/t/b.md", nota(["../../raw/t/fuente.md"], 'Dice "una cita que no existe en la fuente".'))
        (sosp, _, _), _ = self.ejecutar()
        self.assertEqual(sosp, 1)

    def test_fecha_y_codigo_ignorado(self):
        escribir(self.b, "wiki/t/a.md", nota(["../../raw/t/fuente.md"],
                 "Publicado el 2026-04-02. `version 9999` no cuenta.\n```\n1234567\n```"))
        (sosp, _, _), _ = self.ejecutar()
        self.assertEqual(sosp, 0)

    def test_evidencia_transitiva_por_otra_nota(self):
        escribir(self.b, "wiki/t/fuente-a.md", nota(["../../raw/t/fuente.md"], "Resumen."))
        escribir(self.b, "wiki/c/concepto.md", nota(["../t/fuente-a.md"], "Según la fuente, 4,500 tests."))
        (sosp, err, _), _ = self.ejecutar()
        self.assertEqual((sosp, err), (0, 0))

    def test_errores_de_evidencia(self):
        escribir(self.b, "wiki/t/sin-raw.md", "---\ntype: Concepto\n---\n\nTexto.\n")
        escribir(self.b, "wiki/t/rota.md", nota(["../../raw/t/no-existe.md"], "Texto."))
        (_, err, _), out = self.ejecutar()
        self.assertEqual(err, 3)  # sin raw ×2 (rota tampoco tiene raw) + recurso inexistente
        self.assertIn("recurso inexistente", out)

    def test_respuesta_archivada_no_necesita_raw(self):
        escribir(self.b, "wiki/t/fuente-a.md", nota(["../../raw/t/fuente.md"], "Resumen."))
        escribir(self.b, "wiki/t/resp.md", nota(["fuente-a.md"], "Hubo 9.999 cosas.", tipo="Respuesta archivada"))
        (sosp, err, _), _ = self.ejecutar()
        self.assertEqual((sosp, err), (0, 0))

    def test_inventario_respeta_sin_material(self):
        escribir(self.b, "raw/t/huerfano.md", "x")
        escribir(self.b, "raw/t/descartado.md", "x")
        escribir(self.b, "wiki/log.md", "# Registro\n\n## 2026-11-09\n* **Sin material**: `raw/t/descartado.md`\n")
        escribir(self.b, "wiki/t/a.md", nota(["../../raw/t/fuente.md"], "Texto."))
        (_, _, inv), out = self.ejecutar()
        self.assertEqual(inv, 1)
        self.assertIn("raw/t/huerfano.md", out)

    def test_canon_numero(self):
        self.assertEqual(ve.canon_numero("4.500"), ve.canon_numero("4,500"))
        self.assertEqual(ve.canon_numero("0,3 %"), ve.canon_numero("0.3%"))


if __name__ == "__main__":
    unittest.main()
