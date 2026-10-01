<%@ page contentType="text/html;charset=UTF-8" %><%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EduManage Login</title>
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css"></head><body><div class="login">
<form class="card" method="post" action="login"><h2>🎓 EduManage</h2><span>Sign in to your account</span>
<c:if test="${not empty error}"><div class="err"><c:out value="${error}"/></div></c:if>
<input name="username" placeholder="Username" required autofocus>
<input name="password" id="pw" type="password" placeholder="Password" required>
<label><input type="checkbox" style="width:auto" onclick="pw.type=this.checked?'text':'password'"> Show password</label>
<button class="btn" style="width:100%">Login</button></form></div></body></html>
