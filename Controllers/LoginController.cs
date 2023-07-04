using HSMINET.Interface;
using HSMINET.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;

namespace HSMINET.Controllers
{
    public class LoginController : Controller
    {
        private readonly ILogin _Ilogin;

        public LoginController(ILogin ILogin)
        {
            _Ilogin = ILogin;
        }

        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Login(LoginViewModel loginViewModel,string returnUrl = "")
        {
            try
            {
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }
                else if (!string.IsNullOrEmpty(loginViewModel.Username) && !string.IsNullOrEmpty(loginViewModel.Password))
                {
                    var Username = loginViewModel.Username;
                    var Password = EncryptionLibrary.EncryptText(loginViewModel.Password);
                    var Result = _Ilogin.ValidateUser(Username, Password);

                    if (Result != null)
                    {
                        if (Result.RegistrationID == 0 || Result.RegistrationID < 0)
                        {
                            ViewBag.errormessage = "Entered Invalid Username and Password";
                        }
                        else
                        {
                            var RoleID = Result.RoleID;
                            Remove_Anonymous_Cookies();
                            HttpContext.Session.SetString("UserID", Convert.ToString(Result.RegistrationID));
                            HttpContext.Session.SetString("RoleID", Convert.ToString(Result.RoleID));
                            HttpContext.Session.SetString("Username", Convert.ToString(Result.Username));
                            HttpContext.Session.SetString("Email", Convert.ToString(Result.Email));

                            if (RoleID == 1)
                            {
                                return RedirectToAction("Dashboard", "Admin");
                            }
                            else if (RoleID == 2)
                            {
                                return RedirectToAction("Dashboard", "Agent");
                            }
                            else if (RoleID == 3)
                            {
                                return RedirectToAction("Dashboard", "SuperAdmin");
                            }
                        }
                    }
                    else
                    {
                        ViewBag.errormessage = "Entered Invalid Username and Password";
                        return View();
                    }
                }
                return View();
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpGet]
        public IActionResult Logout()
        {
            try
            {
                CookieOptions options = new();
                if (Request.Cookies["HSChannel"] != null)
                {
                    options.Expires = DateTime.Now.AddDays(-1);
                    Response.Cookies.Append("HSChannel", "", options);
                }
                HttpContext.Session.Clear();
                return RedirectToAction("Login", "Login");
            }
            catch (Exception)
            {
                throw;
            }
        }

        [NonAction]
        public void Remove_Anonymous_Cookies()
        {
            if (Request.Cookies["HSChannel"] != null)
            {
                CookieOptions cookie = new();
                cookie.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Append("HSChannel", "", cookie);
            }
        }
    }
}