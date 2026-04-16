ChipSail

El proyecto consiste en hacer una pagina la cual pueda extraer diferentes productos en aplicaciones de ventas en linea, con el fin de comparar precios y su respectiva calidad por webscrapping

Brenda Valeria Malagón Baquero – 1202754
Andrés Camilo Riveros Vargas – 1202757
Valeria Sofia Contreras Sanchez - 1202763

El sistema busca desarrollar una página web capaz de extraer automáticamente productos desde distintas plataformas de ventas en línea mediante técnicas de webscraping, permitiendo a los usuarios buscar artículos por imagen o descripción, comparar dinámicamente precios entre diferentes vendedores y evaluar la calidad del producto en un solo lugar; con esto se pretende solucionar el problema de la dispersión de información en múltiples tiendas digitales, la dificultad para encontrar el mejor precio y la falta de herramientas centralizadas que faciliten una decisión de compra informada, rápida y eficiente.

El sistema será utilizado por personas entre 17 y 60 años que realizan compras en línea, incluyendo estudiantes, trabajadores y usuarios en general que desean comparar precios y evaluar productos antes de comprarlos. El sistema se utilizará a través de una página web donde el usuario podrá buscar productos mediante texto o imágenes, visualizar resultados obtenidos por webscraping desde diferentes plataformas de comercio electrónico, comparar precios, características y valoraciones, y así tomar decisiones de compra más informadas de forma rápida y centralizada.

Requisitos Funcionales:

1. Extraer información pública de perfiles.
Permite obtener datos relevantes de vendedores o productos sin acceder a información
privada, garantizando el cumplimiento de políticas.
2. Realizar búsquedas por palabras clave.
Facilita que el usuario encuentre productos de forma rápida y natural.
3. Extraer ofertas públicas.
Permite identificar descuentos y promociones disponibles en las plataformas.
4. Almacenar información estructurada.
Garantiza que los datos recolectados puedan ser consultados, comparados y
analizados posteriormente.
5. Detectar actualizaciones en productos.
Permite identificar cambios de precio, disponibilidad o reputación.
6. Extraer información de productos.
Incluye nombre, precio, imágenes, descripción, valoraciones y vendedor.
7. Monitorear precios y subastas.
Permite observar variaciones del mercado en el tiempo.
8. Extraer reputación de vendedores.
Ayuda a la toma de decisiones más confiables.
9. Gestionar paginación.
Necesario para un scraping eficiente en resultados extensos.
10. Generar series temporales de precios.
Permite análisis histórico y detección de tendencias.
11. Extraer publicaciones públicas.
Permite detectar nuevos productos o cambios en catálogos.
12. Filtrar por hashtags o keywords.
Mejora precisión de búsqueda y segmentación.
13. Capturar métricas de interacción.
Incluye número de ventas, valoraciones y popularidad.
14. Analizar frecuencia temporal.
Permite detectar cuándo aparecen ofertas o cambios de precio.
15. Exportar datos para análisis NLP.
Facilita análisis avanzado como clasificación, clustering o recomendación.

Requisitos No Funcionales:

1. Interfaz web en HTML (UI amigable).
Debe ser clara, intuitiva y enfocada en comparativas visuales.
2. Uso de base de datos con autenticación JWT.
Permite manejo seguro de sesiones y protección de datos del usuario.
3. Rendimiento.
El sistema debe responder en menos de 3 segundos para consultas comunes.
4. Seguridad.
Debe garantizar autenticación, control de acceso y protección contra scraping
malicioso hacia la propia plataforma.
5. Disponibilidad.
El sistema debe mantenerse disponible al menos el 99% del tiempo.
6. Escalabilidad.
Debe permitir agregar nuevas plataformas de scraping sin rediseño completo.
7. Mantenibilidad.
El código debe ser modular para adaptarse a cambios en páginas externas.
8. Usabilidad.
El usuario debe entender la comparativa sin conocimientos técnicos.
9. Compatibilidad.
Debe funcionar en navegadores modernos.

Diagramas UML

<img width="557" height="589" alt="image" src="https://github.com/user-attachments/assets/d50a1c62-e96f-465c-b8b6-2b3dc0ebb206" />
Muestra lo que puede hacer el usuario y el administrador
<img width="649" height="387" alt="image" src="https://github.com/user-attachments/assets/ba602c09-f39b-41ac-baec-eb8e3d0d2576" />
<img width="644" height="408" alt="image" src="https://github.com/user-attachments/assets/14ce5a1e-75f6-4038-b3f5-e7c6a919bf6c" />
El diagrama de secuencia nos muestra como se haria el metodo de scrapping al ejecutar la busqueda mandando un "request" a las paginas 
<img width="940" height="770" alt="image" src="https://github.com/user-attachments/assets/9491e6a6-1dbb-4659-a932-acc6d6430d8a" />
<img width="919" height="710" alt="image" src="https://github.com/user-attachments/assets/e9079cf2-b0af-4585-8bcc-dc2fea1379b8" />

Design

https://www.figma.com/site/w2I8a9xDpfUhmrGW8LaMfg/ChipSail?node-id=0-1&t=d3PomPPKylkDCLI4-1

Prototipo

https://www.figma.com/site/w2I8a9xDpfUhmrGW8LaMfg/ChipSail?node-id=0-1&p=f&t=d3PomPPKylkDCLI4-0

🗄️ 6. Diseño de Base de Datos

Imagen del modelo:
<img width="1014" height="491" alt="Relaciones" src="https://github.com/user-attachments/assets/9b116762-c489-4264-a553-e8330eaa9da0" />

Tablas principales

Registro:
<img width="380" height="148" alt="Registro" src="https://github.com/user-attachments/assets/416c381f-9ed2-42d5-9b31-7ed6dda0ce1a" />

Resultado(de la busqueda):
<img width="372" height="168" alt="Resultado" src="https://github.com/user-attachments/assets/d70b4872-c2c9-496d-96c7-ec51cd97a6f4" />

Carrito:
<img width="374" height="70" alt="Carrito" src="https://github.com/user-attachments/assets/0f4dbdd0-b705-43a1-8fc7-4c5f3a11ed32" />

Pago:
<img width="375" height="99" alt="Pago" src="https://github.com/user-attachments/assets/ba5c91fc-c9b7-4b95-a9aa-c3197f23418d" />

🧩 7. Documentación del Sistema
Estructura de Carpetas

README.md      Contiene la descripción de todo el apartado de creación del proyecto.
styles.css     Contiene los estilos a usar en las diferentes clases usadas en el index.
Script.js      Contiene las funciones que permiten que se pueda pasar de un apartado a otro o las propias interacciones con la pagina.
assets/        Contiene las imagenes a ser usadas en la pagina.

🚀 8. Instalación y Ejecución

Se puede descargar como zip, al tenerlo ya en el computador se descomprime y se abre el folder haciendo uso de VScode el cual se tiene que hacer uso de una extension si se quiere abrir como puede ser Live Server
Se le da click derecho al index.html y se le da a abrir en Live Server.

