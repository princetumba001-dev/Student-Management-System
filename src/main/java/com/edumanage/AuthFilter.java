package com.edumanage;
import jakarta.servlet.*; import jakarta.servlet.annotation.*; import jakarta.servlet.http.*; import java.io.IOException;
@WebFilter("/*")
public class AuthFilter implements Filter {
    public void doFilter(ServletRequest rq, ServletResponse rs, FilterChain ch) throws IOException, ServletException {
        HttpServletRequest q = (HttpServletRequest) rq; HttpServletResponse p = (HttpServletResponse) rs;
        String path = q.getRequestURI().substring(q.getContextPath().length());
        boolean open = path.equals("/login") || path.startsWith("/css/");
        HttpSession s = q.getSession(false);
        if (open || (s != null && s.getAttribute("user") != null)) ch.doFilter(rq, rs); else p.sendRedirect(q.getContextPath() + "/login");
    }
}
