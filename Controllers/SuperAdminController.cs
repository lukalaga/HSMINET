using HSMINET.Interface;
using HSMINET.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Net.Mail;
using System.Threading.Tasks;

namespace HSMINET.Controllers
{
    // [ValidateSuperAdminSession]
    public class SuperAdminController : Controller
    {
        private readonly IRegistration _IRegistration;
        private readonly IRoles _IRoles;
        private ILogin _ILogin;

        public SuperAdminController(ILogin login, IRegistration registration, IRoles IRoles)
        {
            _IRegistration = registration;
            _IRoles = IRoles;
            _ILogin = login;
        }

        [HttpGet]
        public ActionResult CreateAdmin()
        {
            return View(new Registration());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateAdmin(Registration registration)
        {
            var isUsernameExists = _IRegistration.CheckUserNameExists(registration.Username);
            if (isUsernameExists)
            {
                ModelState.AddModelError("", errorMessage: "Username Exists");
            }
            else
            {
                registration.CreatedOn = DateTime.Now;
                registration.RoleID = _IRoles.GetRolesOfUsersByRoleName("Admin");
                registration.Password = EncryptionLibrary.EncryptText(registration.Password);
                registration.ConfirmPassword = EncryptionLibrary.EncryptText(registration.ConfirmPassword);
                if (_IRegistration.AddUser(registration) > 0)
                {
                    MailMessage mail = new();
                    mail.From = new MailAddress("nickson.lukalaga@minet.co.ke", "Admin");
                    mail.To.Add(registration.Email);
                    mail.Subject = "Health & Safety Credentials";
                    mail.Body = "<p>Dear " + registration.Name.ToString() +
                            "<p>Below are your credentials for Health & Safety Help Desk</p>" +
                            "<p>Username: " + registration.Username + "</p>" +
                            "<p>Password: " + EncryptionLibrary.DecryptText(registration.Password) +
                            "<p> Use the Following Link</p>" +
                            "<a href='http://35.164.197.190:8090'>Health & Safety Help Desk</p>";
                    mail.IsBodyHtml = true;

                    using (var smtp = new SmtpClient())
                    {
                        smtp.Port = 25;
                        smtp.Host = "za-smtp-outbound-2.mimecast.co.za";
                        await smtp.SendMailAsync(mail);
                        smtp.UseDefaultCredentials = false;
                        TempData["MessageRegistration"] = "Success";
                    }
                    return RedirectToAction("CreateAdmin");
                }
                else
                {
                    return View("CreateAdmin", registration);
                }
            }
            return RedirectToAction("Dashboard");
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
        public IActionResult CreateAgent()
        {
            return View(new Registration());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateAgent(Registration registration)
        {
            var isUsernameExists = _IRegistration.CheckUserNameExists(registration.Username);

            if (isUsernameExists)
            {
                ModelState.AddModelError("", errorMessage: "Username Already Used try unique one!");
            }
            else
            {
                registration.CreatedOn = DateTime.Now;
                registration.RoleID = _IRoles.GetRolesOfUsersByRoleName("Users");
                registration.Password = EncryptionLibrary.EncryptText(registration.Password);
                registration.ConfirmPassword = EncryptionLibrary.EncryptText(registration.ConfirmPassword);
                if (_IRegistration.AddUser(registration) > 0)
                {
                    MailMessage mail = new();
                    mail.From = new MailAddress("nickson.lukalaga@minet.co.ke", "Admin");
                    mail.To.Add(registration.Email);
                    mail.Subject = "Health & Safety Credentials";
                    mail.Body = "<p>Dear " + registration.Name.ToString() +
                            "<p>Below are your credentials for H&S Help Desk</p>" +
                            "<p>Username: " + registration.Username + "</p>" +
                            "<p>Password: " + EncryptionLibrary.DecryptText(registration.Password) +
                            "<p> Use the Following Link</p>" +
                            "<a href='http://35.164.197.190:8090'>H&S Help Desk</p>";
                    mail.IsBodyHtml = true;
                    registration.CreatedOn = DateTime.Now;
                    registration.RoleID = _IRoles.GetRolesOfUsersByRoleName("Admin");
                    registration.Password = EncryptionLibrary.EncryptText(registration.Password);
                    registration.ConfirmPassword = EncryptionLibrary.EncryptText(registration.ConfirmPassword);
                    using (var smtp = new SmtpClient())
                    {
                        smtp.Port = 25;
                        smtp.Host = "za-smtp-outbound-2.mimecast.co.za";
                        await smtp.SendMailAsync(mail);
                        smtp.UseDefaultCredentials = false;
                        TempData["MessageRegistration"] = "Data Saved Successfully!";
                    }

                    return RedirectToAction("CreateAgent");
                }
                else
                {
                    return View("CreateAgent", registration);
                }
            }
            return RedirectToAction("Dashboard");
        }

        public JsonResult CheckUserNameExists(string Username)
        {
            try
            {
                var isUsernameExists = false;

                if (Username != null)
                {
                    isUsernameExists = _IRegistration.CheckUserNameExists(Username);
                }

                if (isUsernameExists)
                {
                    return Json(data: true);
                }
                else
                {
                    return Json(data: false);
                }
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}