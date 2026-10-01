<%@ page contentType="text/html;charset=UTF-8" %><%@ include file="_layout-top.jspf" %>
<h1>Dashboard</h1><c:if test="${not empty error}"><div class="err">${fn:escapeXml(error)}</div></c:if>
<div class="cards"><div class="card">👨‍🎓<b>${students}</b><span>Total Students</span></div><div class="card">👩‍🏫<b>${teachers}</b><span>Total Teachers</span></div>
<div class="card">📚<b>${courses}</b><span>Total Courses</span></div><div class="card">🏛️<b>${depts}</b><span>Total Departments</span></div></div>
<div class="card"><h3>Recent Students</h3><div class="tw"><table><tr><th>ID</th><th>Name</th><th>Department</th><th>Semester</th></tr>
<c:forEach var="s" items="${recent}"><tr><td>${fn:escapeXml(s.code)}</td><td>${fn:escapeXml(s.name)}</td><td>${fn:escapeXml(s.dept)}</td><td>${s.semester}</td></tr></c:forEach></table></div>
<p><a class="btn" href="students?action=new">+ Add Student</a></p></div>
<%@ include file="_layout-bottom.jspf" %>
