package com.edumanage;
import jakarta.servlet.*; import jakarta.servlet.annotation.*; import jakarta.servlet.http.*; import java.io.IOException;
@WebServlet({"/dashboard", ""})
public class DashboardServlet extends HttpServlet {
    protected void doGet(HttpServletRequest q, HttpServletResponse p) throws ServletException, IOException {
        try { StudentDAO d = new StudentDAO();
            q.setAttribute("students", d.count("students")); q.setAttribute("teachers", d.count("teachers"));
            q.setAttribute("courses", d.count("courses")); q.setAttribute("depts", d.count("departments"));
            q.setAttribute("recent", d.search("", 0).stream().limit(5).toList());
        } catch (Exception e) { q.setAttribute("error", e.getMessage()); }
        q.getRequestDispatcher("/dashboard.jsp").forward(q, p);
    }
}
