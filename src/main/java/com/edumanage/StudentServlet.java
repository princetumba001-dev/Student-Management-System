package com.edumanage;
import jakarta.servlet.*; import jakarta.servlet.annotation.*; import jakarta.servlet.http.*;
import java.io.IOException; import java.sql.SQLException;

@WebServlet("/students")
public class StudentServlet extends HttpServlet {
    private final StudentDAO dao = new StudentDAO();

    protected void doGet(HttpServletRequest q, HttpServletResponse p) throws ServletException, IOException {
        String a = q.getParameter("action"); if (a == null) a = "list";
        try {
            q.setAttribute("depts", dao.departments());
            switch (a) {
                case "new" -> { q.setAttribute("s", new Student()); forward(q, p, "student-form"); }
                case "edit" -> { q.setAttribute("s", dao.find(id(q))); forward(q, p, "student-form"); }
                case "view" -> { q.setAttribute("s", dao.find(id(q))); forward(q, p, "student-view"); }
                default -> {
                    String k = q.getParameter("q") == null ? "" : q.getParameter("q").trim();
                    int d = q.getParameter("dept") == null || q.getParameter("dept").isEmpty() ? 0 : Integer.parseInt(q.getParameter("dept"));
                    q.setAttribute("list", dao.search(k, d)); q.setAttribute("kw", k); q.setAttribute("selDept", d); forward(q, p, "students");
                }
            }
        } catch (SQLException e) { throw new ServletException(e); }
    }

    protected void doPost(HttpServletRequest q, HttpServletResponse p) throws ServletException, IOException {
        HttpSession ses = q.getSession();
        try {
            if ("delete".equals(q.getParameter("action"))) {
                dao.delete(id(q)); ses.setAttribute("toast", "Student deleted successfully"); p.sendRedirect("students"); return;
            }
            Student s = new Student(); String idp = q.getParameter("id"); s.setId(idp == null || idp.isEmpty() ? 0 : Integer.parseInt(idp));
            s.setCode(t(q, "code")); s.setName(t(q, "name")); s.setGender(t(q, "gender")); s.setDob(t(q, "dob")); s.setEmail(t(q, "email"));
            s.setPhone(t(q, "phone")); s.setAddress(t(q, "address")); s.setStatus(t(q, "status"));
            try { s.setDeptId(Integer.parseInt(t(q, "deptId"))); s.setSemester(Integer.parseInt(t(q, "semester"))); } catch (NumberFormatException e) { }
            String err = validate(s);
            if (err != null) { q.setAttribute("error", err); q.setAttribute("s", s); q.setAttribute("depts", dao.departments()); forward(q, p, "student-form"); return; }
            dao.save(s); ses.setAttribute("toast", s.getId() == 0 ? "Student added successfully" : "Student updated successfully");
            p.sendRedirect("students");
        } catch (SQLException e) {
            String m = e.getMessage() != null && e.getMessage().contains("Duplicate") ? "Student ID already exists" : "Database error: " + e.getMessage();
            ses.setAttribute("toast", m); p.sendRedirect("students");
        }
    }

    private String validate(Student s) {
        if (s.getCode().isEmpty() || s.getName().isEmpty() || s.getDob().isEmpty() || s.getDeptId() == 0 || s.getSemester() == 0) return "Please fill all required fields.";
        if (!s.getEmail().matches("^[\\w.+-]+@[\\w-]+\\.[\\w.]+$")) return "Enter a valid email address.";
        if (!s.getPhone().matches("\\d{10}")) return "Mobile number must be 10 digits.";
        return null;
    }
    private String t(HttpServletRequest q, String n) { String v = q.getParameter(n); return v == null ? "" : v.trim(); }
    private int id(HttpServletRequest q) { return Integer.parseInt(q.getParameter("id")); }
    private void forward(HttpServletRequest q, HttpServletResponse p, String v) throws ServletException, IOException { q.getRequestDispatcher("/" + v + ".jsp").forward(q, p); }
}
