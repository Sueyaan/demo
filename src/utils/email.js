const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function emailTemplate(content) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #000;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;

                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #fff;
                }
                .header {
                    background: #FFD700;
                    color: #000;
                    padding: 30px 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }
                .header p {
                    margin: 5px 0 0 0;
                    font-size: 14px;
                    opacity: 0.9;
                }
                .content {
                    padding: 30px 20px;
                }
                .content h2 {
                    color: #000;
                    font-size: 20px;
                    margin-top: 0;
                }
                .info-box {
                    background: #FFF9E6;
                    padding: 20px;
                    border-left: 4px solid #FFD700;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .info-box h3 {
                    margin-top: 0;
                    color: #000;
                    font-size: 18px;
                }
                .info-box p {
                    margin: 8px 0;
                }
                .button {
                    display: inline-block;
                    background: #FFD700;
                    color: #000;
                    padding: 14px 28px; 
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    margin-top: 20px;
                    transition: background 0.3s;
                }
                .button:hover {
                    background: #FFC700;

                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                    background: #f9f9f9;

                }
                .status-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .status-assigned {
                    background: #FFD700;
                    color: #000;

                }
                .status_in_progress {
                    background: #FFA500;
                    color: #fff;
                }
                .status-done {
                    background: #28a745;
                    color: #fff;
                }
                .warning {
                    color: #dc3545;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏢 B.K & S.I</h1>
                    <p>Employee Management System</p>
                </div>
                ${content}
                <div class="footer">
                    <p>Dies ist eine automatische Benachrichtigung.</p>
                </div>
            </div>
        </body>
        </html>



    `;
}

async function sendTaskAssignedEmail(employee, task, assignedBy) {
    try {
        const content = `
        
            <div class="content">
                <h2>Hallo ${employee.name},</h2>
                <p>Ihnen wurde eine neue Aufgabe zugewiesen von <strong>${assignedBy.name}</strong>.</p>
                
                <div class="info-box">
                    <h3>📋 ${task.title}</h3>
                    ${task.description ? `<p>${task.description}</p>` : ""}
                    ${task.dueAt ? `<p><strong>Fällig am:</strong> ${new Date(task.dueAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year:"numeric" })}</p>` : ""}
                    <p><strong>Status:</strong> <span class="status-badge status-assigned">Zugewiesen</span></p>
                </div>

                <p>Bitte melden Sie sich im System an, um die Aufgabe zu sehen und zu bearbeiten.</p>


                <center>
                    <a href="${FRONTEND_URL}/my-tasks" class="button">Aufgabe anzeigen</a>
                </center>
            </div>
        
        `;

        await resend.emails.send({
            from: FROM_EMAIL,
            to: employee.email,
            subject: `Neue Aufgabe: ${task.tiltle}`,
            html:emailTemplate(content),
        });

        console.log("✅ Task assignment email sent to:", employee.email);

    } catch (error) {
        console.error("❌ Faoöed to send task assignment email:", error);

    }
}




async function sendTaskStatusUpdateEmail(task, updatedBy, newStatus) {
    try {
        const prisma = require("../db/prisma");
        const assignedBy = await prisma.user.findUnique({
            where: { id: task.assignedById },
            select: { email: true, name: true, role: true }
        });

        if (!assignedBy || assignedBy.role === "employee") return;

        const statusLabels = {
            assigned: "Zugewiesen",
            in_progress: "In Bearbeitung",
            done: "Erledigt"
        };

        const statusClass = `status-${newStatus}`;

        const content = `
            <div class="content">
                <h2>Hallo ${assignedBy.name},</h2>
                <p>Der Status einer Aufgabe wurde aktualisiert von <strong>${updatedBy.name}</strong>.</p>

                <div class="info-box">
                    <h3>📋 ${task.title}</h3>
                    <p><strong>Neuer Status:</strong> <span class="status-badge ${statusClass}">${statusLabels[newStatus]}</span></p>
                    ${task.assignedTo ? `<p><strong>Zugewiesen an:</strong> ${task.assignedTo.name}</p>` : ""}
                </div>

                <center>
                    <a href="${FRONTEND_URL}/dashboard" class="button">Dashboard öffenen</a>
                </center>
            </div>
        
        `;

        await resend.emails.send({
            from: FROM_EMAIL,
            to: assignedBy.email,
            subject: `Aufgabe aktualisiert: ${task.title} - ${statusLabels[newStatus]}`,
            html: emailTemplate(content),
        });

        console.log("✅ Task status update email sent to", assignedBy.email);

    } catch (error) {
        console.error ("❌ Failed to send task status updated email:", error);
    }
}









async function sendWelcomeEmail(employee, tempPassword) {
    try {
        const content = `
            <div class="content">
                <h2>Willkommen bei B.K & S.I, ${employee.name}! 👋</h2>
                <p>Ihr Zugang zum Employee Management System wurde erfolgreich erstellt.</p>
                <div class="info-box">
                    <h3>🔐 Ihre Anmeldedaten:</h3>
                    <p><strong>E-Mail:</strong> ${employee.email}</p>
                    <p><strong>Password:</strong> <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 3px;">${tempPassword}</code></p>
                    <p class="warning">⚠️ Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung!</p>
                </div>
                <h3>Was Sie im System tun können:</h3>
                <ul style="line-height: 2;">
                    <li>✅ Ein- und Ausstempeln für Ihre Arbeitszeiten</li>
                    <li>✅ Ihre zugewiesenen Aufgaben sehen und bearbeiten</li>
                    <li>✅ Ihren Arbeitsverlauf einsehen</li>
                    <li>✅ Mit Ihrem Team kommunizieren</li>
                </ul>
                <center>
                    <a href="${FRONTEND_URL}" class="button">Jetzt anmelden</a>
                </center>

                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Bei Fragen wenden Sie sich bitte an Ihren Vorgesetzten.
                </p>
            </div>
        `;
        await resend.emails.send({
            from: FROM_EMAIL,
            to: employee.email,
            subject: "Willkommen bei B.K & S.I - Ihr Zugang",
            html: emailTemplate(content),
        });

        console.log("✅ Welcome email sent to:", employee.email);

    } catch (error) {
        console.error("❌ Failed to send welcome email:", error);
    }
}

async function sendTaskDeadlineReminderEmail(employee, task, hoursRemaining) {
    try {
        const content = `
            <div class="content">
                <h2>Hallo ${employee.name},</h2>
                <p>⏰ <strong>Erinnerung:</strong> Eine Ihrer Aufgaben ist bald fällig!</p>
                
                <div class="info-box">
                    <h3>📋 ${task.title}</h3>
                    ${task.description ? `<p>${task.description}</p>` : ""}
                    <p><strong>Fällig am:</strong> ${new Date(task.dueAt).toLocaleDateString("de-DE",{ day: "2-digit", month:"2-digit", year:"numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    <p><strong>Verbleibende Zeit:</strong><span class="warning">${hoursRemaining}</span></p>
                    <p><strong>Aktueller Status:</strong> <span class="status-badge status-${task.status}">${task.status === "in_progress" ? "In Bearbeitung" : "Zugewiesen"}</span></p>
                </div>
                <p>Bitte stellen Sie sicher, dass Sie die Aufgabe rechtzeitig abschließen.</p>

                <center>
                    <a href="${FRONTEND_URL}/my-task" class="button"Aufgabe öffnen></a>
                </center>
            </div>
        `;

        await resend.emails.send({
            from: FROM_EMAIL,
            to: employee.email,
            subject: "⏰ Erinnerung: ${task.title} ist bald fällig",
            html: emailTemplate(content),
        });

        console.log("✅ Deadline reminder email sent to:", employee.email);

    } catch (error) {
        console.error("❌ Failed to send deadline reminder email:", error);

    }
}

async function sendDailySummaryEmail(recipient, attendanceDate) {
    try {
        const { date, totalShifts, activeShifts, completedShifts, totalHours, employees } = attendanceDate;

        let employeeRows = "";
        employees.forEach(emp => {
            employeeRows += `
                <tr style="border-botton: 1px solid #eee;">
                    <td style="padding: 12px 8px;">${emp.name}</td>
                    <td style="padding: 12px 8px;">${emp.clockIn || "-"}</td>
                    <td style="padding: 12px 8px;">${emp.clockOut || "Aktiv"}</td>
                    <td style="padding: 12px 8px;>${emp.hours || "-"}</td>
                </tr>
            `;
        });

        const content = `
            <div class="content">
                <h2>Tägliche Anwesenheits-Zusammenfassung</h2>
                <p><strong>Datum:</strong> ${new Date(date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                
                <div class="info-box">
                    <p><strong>Gesamt Schichten:</strong> ${totalShifts}</p>
                    <p><strong>Aktive Schichten:</strong> ${activeShifts}</p>
                    <p><strong>Abgeschlossene Schichten:</strong> ${completedShifts}</p>
                    <p><strong>Gesamt Arbeitsstunden:</strong> ${totalHours.toFixed(1)} Std.</p>
                </div>

                <h3>Mitarbeiter Details:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #FFD700;">
                            <th style="padding: 12px 8px; text-align: left;">Mitarbeiter</th>
                            <th style="padding: 12px 8px; text-align: left;">Einstempeln</th>
                            <th style="padding: 12px 8px; text-align: left;">Ausstempeln</th>
                            <th style="padding: 12px 8px; text-align: left;">Stunden</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employeeRows}
                    </thead>
                </table>
                
                <center>
                    <a href="${FRONTEND_URL}/attendence" class="button">Vollständigen Bericht anzeigen</a>
                </center>
            </div>
        `;

        await resend.emails.send({
            from:FROM_EMAIL,
            to: recipient.email,
            subject: `📊 Anwesenheits-Zusammenfassung - ${new Date(date).toLocaleDateString('de-DE')}`,
            html: emailTemplate(content),   

        });

        console.log("✅ Daily summary email sent to:", recipient.email);



    } catch (error) {
        console.error("❌ Failed to send daily summary email:", error);
    }
}

module.exports = {
    sendTaskAssignedEmail,
    sendTaskStatusUpdateEmail,
    sendWelcomeEmail,
    sendTaskDeadlineReminderEmail,
    sendDailySummaryEmail,
};