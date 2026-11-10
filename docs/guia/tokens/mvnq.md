# La salida de Maven (mvnq)

Cada vez que el agente compila o lanza los tests, **lee toda la salida del comando**, y todo lo que lee ocupa contexto y cuesta [tokens](../ayuda/glosario.md#token). Maven es muy hablador: descargas, plugins, una línea por cada fase de cada módulo, trazas de cien líneas… Casi nada de eso le sirve al agente para decidir qué hacer. `mvnq` es el envoltorio de **[meta-harness](../ayuda/glosario.md#meta-harness)** que ejecuta Maven y le enseña solo lo que importa. La *q* viene de *quiet*, «silencioso».

## Cuánto ahorra (medido en PetClinic)
El mismo `verify` de Spring PetClinic (84 tests), lanzado con Maven a pelo y con `mvnq`:

| Caso | Maven a pelo | Con `mvnq` | Ahorro |
|---|---|---|---|
| Todo en verde | 823 líneas · 97.342 caracteres (≈ 24.000 tokens) | 4 líneas · ≈ 210 caracteres (≈ 50 tokens) | **99,8 %** |
| Un test que falla | 837 líneas · 98.105 caracteres (≈ 24.500 tokens) | 14 líneas · ≈ 1.300 caracteres (≈ 330 tokens) | **98,7 %** |

<small>Tokens estimados con la regla habitual de unos 4 caracteres por token; sirve para comparar, no es una cifra exacta.</small>

En una sesión normal el agente compila varias veces (antes del cambio, después, tras corregir un fallo…). Sin el filtro, cada ejecución metería unos 24.000 tokens en el contexto, que además **se arrastran** en cada mensaje posterior hasta que la sesión se compacta.

## Qué ve el agente
Cuando todo va bien:

```text
[INFO] Tests run: 84, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time:  42.021 s

[mvnq] ./mvnw verify → código 0. Log completo (824 líneas): .mh/tmp/mvn-ultimo.log
```

Cuando falla un test, justo lo necesario para arreglarlo: qué test, qué esperaba, qué obtuvo y dónde.

```text
[ERROR] org.springframework.samples.petclinic.owner.PetValidatorTests.supportsPetClass -- <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <false> but was: <true>
	at org.junit.jupiter.api.AssertionFailureBuilder.build(AssertionFailureBuilder.java:158)
	at org.junit.jupiter.api.AssertionFailureBuilder.buildAndThrow(AssertionFailureBuilder.java:139)
	at org.junit.jupiter.api.AssertFalse.failNotFalse(AssertFalse.java:69)
[ERROR] Failures:
[ERROR]   PetValidatorTests.supportsPetClass:68 expected: <false> but was: <true>
[ERROR] Tests run: 84, Failures: 1, Errors: 0, Skipped: 0
[INFO] BUILD FAILURE
[ERROR] Failed to execute goal …maven-surefire-plugin…: There are test failures.

[mvnq] ./mvnw verify → código 1. Log completo (837 líneas): .mh/tmp/mvn-ultimo.log
```

## Cómo funciona
1. Ejecuta Maven con los mismos argumentos que le pases: `node .mh/scripts/mvnq.mjs verify` equivale a `./mvnw verify`. Usa el Maven Wrapper (`mvnw`) si el proyecto lo tiene y añade `-B -ntp` (sin colores ni barras de descarga).
2. Guarda la salida **completa** en `.mh/tmp/mvn-ultimo.log`, que no se versiona.
3. De esa salida **conserva** solo:
    - errores de compilación y líneas `[ERROR]`;
    - los tests que fallan, con su `expected … but was …` y **las 3 primeras líneas** de cada traza;
    - el resumen: `Tests run`, `BUILD SUCCESS/FAILURE`, `Total time` y el resumen por módulo;
    - los avisos de API obsoleta en tu código.
4. **Descarta** también el ruido que se parece a lo anterior pero no dice nada de tu código: avisos de configuración de plugins y las ocho líneas de ayuda genérica que Maven imprime al fallar (`Re-run Maven using the -X switch…`, `[Help 1] http://…`).
5. Si aun así quedan más de 80 líneas, se queda con el principio y el final, y dice cuántas omitió.
6. Devuelve **el mismo código de salida** que Maven: un fallo sigue siendo un fallo para el agente y para los [hooks](../ayuda/glosario.md#hook).

> [!tip] ¿Y si al agente le falta información?
> El log completo sigue en `.mh/tmp/mvn-ultimo.log` y la propia salida lo recuerda en su última línea. El [subagente](../ayuda/glosario.md#subagente) `reparador-compilacion` tiene la instrucción de abrirlo solo si lo filtrado no basta.

## Por qué el agente lo usa siempre
Tres piezas se encargan:

| Pieza | Qué hace |
|---|---|
| Orientación y [skills](../ayuda/glosario.md#skill) | indican `node .mh/scripts/mvnq.mjs verify` como forma de compilar y probar |
| Hook `maven` | si el agente lanza `mvn` o `./mvnw` con `test`, `verify`, `package`, `install` o `integration-test`, **lo bloquea** y le da el comando equivalente con `mvnq` |
| Subagente `ejecutor-tests` | usa un modelo de lenguaje ([LLM](../ayuda/glosario.md#llm)) pequeño y barato, Haiku, que lanza los tests y devuelve solo un resumen |

El hook no interviene en comandos cortos (`mvn dependency:tree`, `mvn -v`) ni en los que ya llevan tubería (`mvn verify | tail`), porque ahí la salida ya está acotada o la has pedido tú. Puedes desactivarlo puntualmente con `MH_DESACTIVAR=maven`.

> [!info]- ¿Por qué un envoltorio y no un hook que recorte la salida?
> Claude Code permite que un hook sustituya la salida de un comando que **termina bien**, pero no la de uno que **falla**, y es justo al fallar cuando Maven escupe más texto. Por eso el filtro va en un script que ejecuta Maven él mismo. La decisión está en la ADR-0008.

## Tú sigues usando Maven
`mvnq` es para el agente. En tu terminal puedes seguir usando `mvn` o `./mvnw` como siempre: el hook solo actúa sobre los comandos que lanza Claude.
