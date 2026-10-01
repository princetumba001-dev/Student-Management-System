<%@ page contentType="text/html;charset=UTF-8" %><%@ include file="_layout-top.jspf" %>
<div class="top"><h1>Students</h1><a class="btn" href="students?action=new">+ Add Student</a></div>
<form class="bar" method="get" action="students"><input name="q" value="${fn:escapeXml(kw)}" placeholder="Search by name, ID or email">
<select name="dept"><option value="">All Departments</option><c:forEach var="d" items="${depts}"><option value="${d.key}" ${d.key==selDept?'selected':''}>${fn:escapeXml(d.value)}</option></c:forEach></select>
<button class="btn">Search</button></form>
<div class="card tw"><table><tr><th>ID</th><th>Name</th><th>Gender</th><th>DOB</th><th>Email</th><th>Phone</th><th>Department</th><th>Sem</th><th>Status</th><th>Actions</th></tr>
<c:forEach var="s" items="${list}"><tr><td>${fn:escapeXml(s.code)}</td><td>${fn:escapeXml(s.name)}</td><td>${fn:escapeXml(s.gender)}</td><td>${s.dob}</td><td>${fn:escapeXml(s.email)}</td><td>${fn:escapeXml(s.phone)}</td><td>${fn:escapeXml(s.dept)}</td><td>${s.semester}</td>
<td><span class="badge ${s.status}">${fn:escapeXml(s.status)}</span></td>
<td><a class="btn s g" href="students?action=view&id=${s.id}">View</a> <a class="btn s" href="students?action=edit&id=${s.id}">Edit</a>
<form method="post" action="students" style="display:inline" onsubmit="return confirm('Delete this student?')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="${s.id}"><button class="btn s r">Delete</button></form></td></tr></c:forEach>
<c:if test="${empty list}"><tr><td colspan="10">No students found.</td></tr></c:if></table></div>
<%@ include file="_layout-bottom.jspf" %>
