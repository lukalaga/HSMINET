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
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace HSMINET.Controllers
{
    [ValidateUserSession]
    public class AgentController : Controller
    {
        private ApplicationDbContext _context;
        private readonly IUsers _users;
        private ILogin _ILogin;
        private IRegistration _IRegistration;
        public string SessionID = "UserID";
        public string UserID = "Username";

        public AgentController(ILogin login, IRegistration registration, ApplicationDbContext context, IUsers users)
        {
            _context = context;
            _users = users;
            _ILogin = login;
            _IRegistration = registration;
        }

        [HttpGet]
        public IActionResult ChangePassword()
        {
            return View(new ChangePasswordModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ChangePassword(ChangePasswordModel changePasswordModel)
        {
            if (!ModelState.IsValid)
            {
                return View(changePasswordModel);
            }
            var password = EncryptionLibrary.EncryptText(changePasswordModel.Password);
            var registrationmodel = _IRegistration.UserInformation(Convert.ToInt32(HttpContext.Session.GetString("UserID")));

            if (registrationmodel.Password == password)
            {
                var registration = new Registration
                {
                    Password = EncryptionLibrary.EncryptText(changePasswordModel.NewPassword),
                    RegistrationID = Convert.ToInt32(HttpContext.Session.GetString("UserID"))
                };
                var result = _ILogin.UpdatePassword(registration);

                if (result)
                {
                    TempData["MessageUpdate"] = "Password Updated Successfully";
                    ModelState.Clear();
                    return View(new ChangePasswordModel());
                }
                else
                {
                    return View(changePasswordModel);
                }
            }
            else
            {
                TempData["MessageUpdate"] = "Invalid Password";
                return View(changePasswordModel);
            }
        }

        [HttpGet]
        public ActionResult Dashboard()
        {
            var MyID = Convert.ToInt32(HttpContext.Session.GetString(SessionID));
            ViewBag.MyTotalCase = _context.Incidences.FromSqlRaw($"SELECT * from AssignedTickets  WHERE AssignToUser =" + MyID).Count();
            ViewBag.MyClosed = _context.AssignedTickets.FromSqlRaw("SELECT * FROM  ASSIGNEDTICKETS WHERE STATUS='C' AND AssignToUser=" + MyID).Count();
            ViewBag.MyOpen = _context.AssignedTickets.FromSqlRaw("SELECT * FROM  ASSIGNEDTICKETS WHERE STATUS='A' AND AssignToUser=" + MyID).Count();
            ViewBag.Today = _context.AssignedTickets.FromSqlRaw("select * from AssignedTickets  WHERE AssignToUser=" + MyID + " AND Status='A' AND CAST(CreatedOn AS date)= CAST(GETDATE() AS date)").Count();
            if (MyID == 0)
            {
                return StatusCode(404);
            }
            List<AssignedTickets> X1 = _context.AssignedTickets.Include(b => b.Incidence).Where(a => a.AssignToUser == MyID).ToList();

            List<Incidence> X2 = _context.Incidences.Where(a => a.TicketUser == MyID).ToList();
            SingleModel MyView = new()
            {
                Incidences = X2,
                AssignedTickets = X1
            };
            if (MyView == null)
            {
                return StatusCode(404);
            }
            return View(MyView);
        }

        public ActionResult ClosedTickets()
        {
            return View();
        }

        [HttpGet]
        public async Task<ActionResult> EditTicket(int? id)
        {
            {
                if (id == null)
                {
                    return StatusCode(400);
                }
                Incidence incidence = await _context.Incidences.FindAsync(id);
                if (incidence == null)
                {
                    return StatusCode(401);
                }
                return View(incidence);
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> EditTicket(Incidence incidence, IList<IFormFile> Files)
        {
            var role = _context.AssignedTickets.FirstOrDefault(a => a.Notifications_Id == incidence.Notifications_Id);

            if (role == null)
            {
                return StatusCode(404);
            }
            role.Status = "C";
            role.ClosedOn = DateTime.Now;
            incidence.ClosedBy = HttpContext.Session.GetString(UserID);
            incidence.TicketUser = Convert.ToInt32(HttpContext.Session.GetString(SessionID));

            try
            {
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
                mail.From = new MailAddress("nickson811@outlook.com", "Admin");
                mail.To.Add("watson.muturi@Minet.co.ke");
                mail.Subject = "Health & Safety - Ticket Closure";
                mail.Body = "<p>Ticket No: " + incidence.Notifications_Id + " Has been Closed by " + incidence.ClosedBy + "</p>";
                mail.IsBodyHtml = true;
                DateTime Timeup = (DateTime)role.ClosedOn;
                DateTime Timedown = (DateTime)role.CreatedOn;
                long DiffTicks = (Timedown - Timeup).Ticks;
                role.TurnAroundTime = Math.Abs(DiffTicks).ToString();

                using var smtp = new SmtpClient();
                // smtp.Port = 25;
                smtp.Port = 587;
                // smtp.Host = "za-smtp-outbound-2.mimecast.co.za";
                smtp.Credentials = new NetworkCredential("nickson811@outlook.com", "Q.sontech321");
                smtp.EnableSsl = true;
                smtp.Host = "smtp-mail.outlook.com";
                smtp.UseDefaultCredentials = false;
                await smtp.SendMailAsync(mail);
                _context.Entry(incidence).State = EntityState.Modified;
                _context.Entry(incidence).Property(x => x.DateReported).IsModified = false; //Track date but don't modify
                await _context.SaveChangesAsync();
                return RedirectToAction("Dashboard", "Agent");
            }
            catch (DbUpdateConcurrencyException ex)
            {
                foreach (var entry in ex.Entries)
                {
                    if (entry.Entity is ApplicationDbContext)
                    {
                        var proposedValues = entry.CurrentValues;
                        var databaseValues = entry.GetDatabaseValues();

                        foreach (var property in proposedValues.Properties)
                        {
                            var proposedValue = proposedValues[property];
                            var databaseValue = databaseValues[property];

                            // TODO: decide which value should be written to database
                            // proposedValues[property] = <value to be saved>;
                        }
                    }
                    else
                    {
                        throw new NotSupportedException("Don't know how to handle concurrency conflicts for " + entry.Metadata.Name);
                    }
                }
            }
            return View(incidence);
        }

        public IActionResult OpenTickets()
        {
            return View();
        }

        public ActionResult LoadTicketData()
        {
            try
            {
                var draw = HttpContext.Request.Form["draw"].FirstOrDefault();
                var start = HttpContext.Request.Form["start"].FirstOrDefault();
                var length = HttpContext.Request.Form["length"].FirstOrDefault();
                var sortColumn = HttpContext.Request.Form["columns[" + Request.Form["order[0][column]"].FirstOrDefault() + "][name]"].FirstOrDefault();
                var sortColumnDir = HttpContext.Request.Form["order[0][dir]"].FirstOrDefault();
                var searchValue = HttpContext.Request.Form["search[value]"].FirstOrDefault();
                int pageSize = length != null ? Convert.ToInt32(length) : 0;
                int skip = start != null ? Convert.ToInt32(start) : 0;
                int recordsTotal = 0;
                var AgentUserID = Convert.ToInt32(HttpContext.Session.GetString("UserID"));
                var RolesData = _users.ShowallTicketsUnderAgent(sortColumn, sortColumnDir, searchValue, AgentUserID);
                recordsTotal = RolesData.Count();
                var data = RolesData.Skip(skip).Take(pageSize).ToList();

                return Json(new { draw, recordsFiltered = recordsTotal, recordsTotal, data });
            }
            catch (Exception)
            {
                throw;
            }
        }

        public ActionResult LoadClosedTickets()
        {
            try
            {
                var draw = HttpContext.Request.Form["draw"].FirstOrDefault();
                var start = HttpContext.Request.Form["start"].FirstOrDefault();
                var length = HttpContext.Request.Form["length"].FirstOrDefault();
                var sortColumn = HttpContext.Request.Form["columns[" + Request.Form["order[0][column]"].FirstOrDefault() + "][name]"].FirstOrDefault();
                var sortColumnDir = HttpContext.Request.Form["order[0][dir]"].FirstOrDefault();
                var searchValue = HttpContext.Request.Form["search[value]"].FirstOrDefault();
                int pageSize = length != null ? Convert.ToInt32(length) : 0;
                int skip = start != null ? Convert.ToInt32(start) : 0;

                int recordsTotal = 0;
                var adminUserID = Convert.ToInt32(HttpContext.Session.GetString("UserID"));
                var rolesData = _users.ShowallClosedTickets(sortColumn, sortColumnDir, searchValue, adminUserID);
                recordsTotal = rolesData.Count();
                var data = rolesData.Skip(skip).Take(pageSize).ToList();

                return Json(new { draw, recordsFiltered = recordsTotal, recordsTotal, data });
            }
            catch (Exception)
            {
                throw;
            }
        }

        //public ActionResult TicketDetails(int? ID)
        //{
        //    try
        //    {
        //        if(ID==null)
        //        {
        //            return StatusCode(404);
        //        }
        //        //var res = _users.getticketdetailsbyid(ID);
        //        return PartialView("_TicketDetails",res);
        //    }
        //    catch (Exception)
        //    {
        //        throw;
        //    }
        //}
    }
}