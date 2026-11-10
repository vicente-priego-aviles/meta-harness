# Test de arquitectura (ArchUnit + jMolecules)

Fuente: jmolecules-integrations (`JMoleculesArchitectureRules.ensureHexagonal()`, `JMoleculesDddRules.all()`).

```xml
<dependency>
  <groupId>org.jmolecules.integrations</groupId>
  <artifactId>jmolecules-archunit</artifactId>
  <version>${jmolecules-integrations.version}</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>com.tngtech.archunit</groupId>
  <artifactId>archunit-junit5</artifactId>
  <version>${archunit.version}</version>
  <scope>test</scope>
</dependency>
```

```java
package <paquete.base>;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.jmolecules.archunit.JMoleculesArchitectureRules;
import org.jmolecules.archunit.JMoleculesDddRules;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "<paquete.base>", importOptions = ImportOption.DoNotIncludeTests.class)
class ArquitecturaArchTest {

    /** Reglas DDD de jMolecules: agregados referenciados por id, entidades con identidad, objetos valor sin identificables. */
    @ArchTest
    ArchRule ddd = JMoleculesDddRules.all();

    /** Puertos y adaptadores (requiere anotaciones hexagonales de jMolecules en los paquetes). */
    @ArchTest
    ArchRule hexagonal = JMoleculesArchitectureRules.ensureHexagonal();

    /** El dominio no depende de Spring, JPA ni Camunda (regla por paquetes, no necesita anotaciones). */
    @ArchTest
    ArchRule dominioPuro = noClasses().that().resideInAPackage("..dominio..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "org.springframework..", "jakarta.persistence..", "io.camunda..", "com.fasterxml.jackson..");

    /** Las capas solo dependen hacia dentro. */
    @ArchTest
    ArchRule aplicacionSinInfraestructura = noClasses().that().resideInAPackage("..aplicacion..")
            .should().dependOnClassesThat().resideInAPackage("..infraestructura..");
}
```

Las reglas por paquete (`dominioPuro`, `aplicacionSinInfraestructura`) funcionan sin anotar nada; `ensureHexagonal()` necesita las anotaciones hexagonales de jMolecules (`@PrimaryPort`, `@SecondaryPort`, `@PrimaryAdapter`, `@SecondaryAdapter`, p. ej. en `package-info.java`). En un proyecto existente, empieza por las reglas por paquete y registra las violaciones actuales como deuda en el brain antes de activarlas en CI.
