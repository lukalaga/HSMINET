﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;

namespace HSMINET.Filters
{
    public class ValidateUserSession : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (!string.IsNullOrEmpty(Convert.ToString(context.HttpContext.Session.GetString("RoleID"))))
            {
                string UserCurrentRole = context.HttpContext.Session.GetString("RoleID");

                if (UserCurrentRole != "2") //User Role = 2
                {
                    ViewResult result = new();
                    result.ViewName = "Error";

                    var controller = context.Controller as Controller;
                    controller.ViewData["ErrorMessage"] = "Invalid User";
                    controller.HttpContext.Session.Clear();
                    context.Result = result;
                }
            }
            else
            {
                ViewResult result = new();
                result.ViewName = "Error";

                var controller = context.Controller as Controller;
                controller.ViewData["ErrorMessage"] = "You Session has been Expired";
                controller.HttpContext.Session.Clear();
                context.Result = result;
            }
        }
    }
}