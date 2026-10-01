# EduManage (Servlet/JSP + JDBC + MySQL)
## Setup
1. **MySQL**: run `sql/schema.sql` (MySQL Workbench or `mysql -u root -p < sql/schema.sql`).
2. **Credentials**: edit `USER`/`PASS` in `src/main/java/com/edumanage/DBConnection.java`.
3. **Requirements**: JDK 17+, Maven, Apache Tomcat 10.1+ (Jakarta namespace). The MySQL JDBC driver is pulled in by `pom.xml`.
4. **Run**: import as a Maven project in IntelliJ/Eclipse, add a Tomcat 10 server, deploy the `EduManage:war exploded` artifact with context path `/EduManage`.
   Or `mvn package` and copy `target/EduManage-1.0.war` to Tomcat's `webapps/`.
5. Open `http://localhost:8080/EduManage/` and log in: **admin / admin123**.
## Implemented
Login/logout with sessions + auth filter, SHA-256 password hashes, dashboard counts, Student CRUD (search, department filter, view), server-side validation, PreparedStatement everywhere, toast notifications, responsive layout.
## Not yet implemented
Teachers, courses, departments, attendance, marks, fees, reports, charts, dark mode (tables exist in the schema).
