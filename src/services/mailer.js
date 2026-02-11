async function sendTaskAssignedEmail({ to, employeeName, taskTitle }) {
  console.log("[TASK ASSIGNED]");
  console.log("to:", to);
  console.log("employee:", employeeName);
  console.log("task:", taskTitle);
  return true;
}

module.exports = { sendTaskAssignedEmail };
