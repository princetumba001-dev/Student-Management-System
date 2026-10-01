package com.edumanage;
import jakarta.servlet.*; import jakarta.servlet.annotation.*; import jakarta.servlet.http.*;
import java.io.IOException; import java.security.MessageDigest; import java.sql.*;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    protected void doGet(HttpServletRequest q, HttpServletResponse p) throws ServletException, IOException { q.getRequestDispatcher("/login.jsp").forward(q, p); }
    protected void doPost(HttpServletRequest q, HttpServletResponse p) throws ServletException, IOException {
        String u = q.getParameter("username"), pw = q.getParameter("password");
        try (Connection c = DBConnection.get(); PreparedStatement ps = c.prepareStatement("SELECT full_name FROM users WHERE username=? AND password_hash=?")) {
            ps.setString(1, u == null ? "" : u.trim()); ps.setString(2, sha256(pw == null ? "" : pw));
            try (ResultSet r = ps.executeQuery()) {
                if (r.next()) {
                    HttpSession old = q.getSession(false); if (old != null) old.invalidate();
                    HttpSession s = q.getSession(true); s.setMaxInactiveInterval(30 * 60);
                    s.setAttribute("user", r.getString(1)); s.setAttribute("toast", "Login successful");
                    p.sendRedirect(q.getContextPath() + "/dashboard"); return;
                }
            }
            q.setAttribute("error", "Invalid username or password");
        } catch (Exception e) { q.setAttribute("error", "Database error: " + e.getMessage()); }
        q.getRequestDispatcher("/login.jsp").forward(q, p);
    }
    static String sha256(String s) throws Exception {
        StringBuilder sb = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(s.getBytes("UTF-8"))) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
