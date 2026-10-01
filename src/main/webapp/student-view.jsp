<%@ page contentType="text/html;charset=UTF-8" %><%@ include file="_layout-top.jspf" %>
<h1>Student Profile</h1><div class="card"><h2>${fn:escapeXml(s.name)} <span class="badge ${s.status}">${fn:escapeXml(s.status)}</span></h2>
<p><b>Student ID:</b> ${fn:escapeXml(s.code)}<br><b>Gender:</b> ${fn:escapeXml(s.gender)}<br><b>Date of Birth:</b> ${s.dob}<br><b>Email:</b> ${fn:escapeXml(s.email)}<br><b>Phone:</b> ${fn:escapeXml(s.phone)}<br>
<b>Department:</b> ${fn:escapeXml(s.dept)}<br><b>Semester:</b> ${s.semester}<br><b>Address:</b> ${fn:escapeXml(s.address)}</p>
<a class="btn" href="students?action=edit&id=${s.id}">Edit</a>
<form method="post" action="students" style="display:inline" onsubmit="return confirm('Delete this student?')"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="${s.id}"><button class="btn r">Delete</button></form>
<a class="btn g" href="students">Back</a></div>
<%@ include file="_layout-bottom.jspf" %>
