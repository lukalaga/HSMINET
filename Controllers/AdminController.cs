using HSMINET.Filters;
using HSMINET.Interface;
using HSMINET.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repository;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Mail;
using System.Threading.Tasks;

namespace HSMINET.Controllers
{
    [ValidateAdminSession]
    public class AdminController : Controller
    {
        private readonly IAssignTickets _IAssignTickets;
        private readonly ApplicationDbContext _context;
        public string SessionID = "UserID";
        public string UserID = "Username";

        public AdminController(ApplicationDbContext context, IAssignTickets IassignTickets)
        {
            _IAssignTickets = IassignTickets;
            _context = context;
        }

        [HttpGet]
        public IActionResult Dashboard()
        {
            ViewBag.TotalCase = _context.Incidences.FromSqlInterpolated($"SELECT * FROM Incidences").Count();
            ViewBag.Resolved = _context.Incidences.FromSqlInterpolated($"SELECT * from Incidences where RoleID IS NULL").Count();
            ViewBag.Pending = _context.Incidences.FromSqlRaw("SELECT * from Incidences R where R.RoleID = 2 and R.Notifications_Id not in (Select Notifications_Id from AssignedTickets)").Count();
            ViewBag.Open = _context.Incidences.FromSqlRaw("SELECT * from Incidences where RoleID=2").Count();

            ViewBag.HighDep = _context.Incidences
                                .GroupBy(q => q.Department)
                                .OrderByDescending(mi => mi.Count())
                                .Take(1)
                                .Select(g => g.Key).ToList().FirstOrDefault();
            ViewBag.HighFloor = _context.Incidences
                                .GroupBy(q => q.Departmentfloor)
                                .OrderByDescending(mi => mi.Count())
                                .Take(1)
                                .Select(g => g.Key).ToList().FirstOrDefault();
            ViewBag.HighUser = _context.Incidences
                                .GroupBy(q => q.Name)
                                .OrderByDescending(mi => mi.Count())
                                .Take(1)
                                .Select(g => g.Key).ToList().FirstOrDefault();
            List<Registration> X3 = _context.Registrations.Where(p => p.RoleID == 1).ToList();
            SingleModel MyView = new()
            {
                Registrations = X3
            };
            if (MyView == null)
            {
                return StatusCode(404);
            }
            return View(MyView);
        }

        public ActionResult MyTickets()
        {
            var MyID = Convert.ToInt32(HttpContext.Session.GetString(SessionID));

            List<AssignedTickets> X1 = _context.AssignedTickets.Where(n => n.AssignToUser == MyID).ToList();
            List<Incidence> X2 = _context.Incidences.Where(n => n.TicketUser == MyID).ToList();

            SingleModel MyTick = new()
            {
                AssignedTickets = X1,
                Incidences = X2
            };
            if (MyTick == null)
            {
                return StatusCode(404);
            }
            return View(MyTick);
        }

        [HttpGet]
        public IActionResult AssignTickets()
        {
            AssignTicketsModel assignTicketsModel = new()
            {
                AdminList = _IAssignTickets.ListOfAgents(),
                TicketList = _IAssignTickets.GetListofUnAssignedTickets()
            };

            // Initialize the Checklist property with the same number of elements as TicketList
            assignTicketsModel.Checklist = new List<bool>(assignTicketsModel.TicketList.Count);
            for (int i = 0; i < assignTicketsModel.TicketList.Count; i++)
            {
                assignTicketsModel.Checklist.Add(false); // Initialize all checklist items as unchecked
            }

            return View(assignTicketsModel);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult AssignTickets(AssignTicketsModel ObjAssign)
        {
            // Check if any ticket is selected
            bool anyTicketSelected = ObjAssign.Checklist.Any(t => t);

            if (!anyTicketSelected)
            {
                TempData["MessageError"] = "Not Selected any ticket";
                ObjAssign.AdminList = _IAssignTickets.ListOfAgents();
                ObjAssign.TicketList = _IAssignTickets.GetListofUnAssignedTickets();

                return View(ObjAssign);
            }

            if (ModelState.IsValid)
            {
                ObjAssign.CreatedBy = HttpContext.Session.GetString("Username");
                ObjAssign.AdminCreated = Convert.ToInt32(HttpContext.Session.GetString("UserID"));
                _IAssignTickets.SaveAssignedTickets(ObjAssign);
            }

            // Reset the model to show the initial state
            ObjAssign = new AssignTicketsModel
            {
                AdminList = _IAssignTickets.ListOfAgents(),
                TicketList = _IAssignTickets.GetListofUnAssignedTickets(),
                Checklist = new List<bool>(ObjAssign.TicketList.Count) // Initialize Checklist with the same count as TicketList
            };

            return RedirectToAction("AssignTickets");
        }

        [HttpGet]
        public async Task<ActionResult> CloseTicket(int? id)
        {
            if (id == null)
            {
                return new StatusCodeResult(404);
            }
            Incidence incidence = await _context.Incidences.FindAsync(id);
            if (incidence == null)
            {
                return StatusCode(401);
            }
            return View(incidence);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> CloseTicket(Incidence incidence, IList<IFormFile> Files)
        {
            if (ModelState.IsValid)
            {
                incidence.ClosedBy = HttpContext.Session.GetString(UserID);
                incidence.TicketUser = Convert.ToInt32(HttpContext.Session.GetString(SessionID));
                incidence.RoleID = null;

                MailMessage mail = new();

                foreach (var file in Files)
                {
                    if (file.Length > 0)
                    {
                        using var ms = new MemoryStream();
                        file.CopyTo(ms);
                        var fileBytes = ms.ToArray();
                        Attachment att = new(new MemoryStream(fileBytes), file.FileName);
                        mail.Attachments.Add(att);
                    }
                }
                if (incidence.Cellphone != null)
                {
                    HttpClient client = new();
                    HttpResponseMessage response = await client.GetAsync("https://collaborationkenya.minet.com/minetapi/smsapi?CellPhone=" + incidence.Cellphone + "&msg=" + incidence.Response);
                    response.EnsureSuccessStatusCode();
                    string responseBody = await response.Content.ReadAsStringAsync();
                    Console.WriteLine(responseBody);
                }
                else if (incidence.Cellphone == null)
                {
                    mail.From = new MailAddress("nickson.lukalaga@minet.co.ke", "Admin");
                    mail.To.Add("Abednego.Obanda@Minet.co.ke");
                    mail.Subject = "Health & Safety - Ticket Closure";
                    mail.Body = "<p>Ticket No: " + incidence.Notifications_Id + " Has been Closed By " + incidence.ClosedBy + "</p>";
                    mail.IsBodyHtml = true;
                    using var smtp = new SmtpClient();
                    smtp.Port = 25;
                    smtp.Host = "za-smtp-outbound-2.mimecast.co.za";
                    await smtp.SendMailAsync(mail);
                    smtp.UseDefaultCredentials = false;
                }
                _context.Entry(incidence).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }
            return RedirectToAction("Dashboard", "Admin");
        }

        public ActionResult OpenTickets()
        {
            List<Incidence> X1 = _context.Incidences.ToList();
            List<AssignedTickets> X2 = _context.AssignedTickets.ToList();

            SingleModel DashView = new()
            {
                Incidences = X1,
                AssignedTickets = X2
            };
            if (DashView == null)
            {
                return StatusCode(404);
            }
            return View(DashView);
        }

        public ActionResult ClosedTickets()
        {
            List<Incidence> X1 = _context.Incidences.Where(n => n.RoleID == null).ToList();
            List<AssignedTickets> X2 = _context.AssignedTickets.Where(n => n.Status == "C").ToList();

            SingleModel CloseView = new()
            {
                Incidences = X1,
                AssignedTickets = X2
            };
            if (CloseView == null)
            {
                StatusCode(404);
            }
            return View(CloseView);
        }
    }
}