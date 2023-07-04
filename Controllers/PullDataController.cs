using HSMINET.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace HSMINET.Controllers
{
    public class PullDataController : Controller
    {
        private readonly string BASEURL = "https://retail.minet.co.ke";
        private readonly ApplicationDbContext _context;

        public PullDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            return await GetData();
        }

        public async Task<IActionResult> GetData()
        {
            _ = _context.Incidences.ToList();
            using var client = new HttpClient();
            client.BaseAddress = new Uri(BASEURL);
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/josn"));
            HttpResponseMessage Res = await client.GetAsync("/hsrJson");

            if (Res.IsSuccessStatusCode)
            {
                var EmpResponse = Res.Content.ReadAsStringAsync().Result;
                // var format = "dd/MM/yyyy";
                // var datetimeconverter = new IsoDateTimeConverter { DateTimeFormat = format };
                List<Incidence> incidences = JsonConvert.DeserializeObject<List<Incidence>>(EmpResponse);
                incidences.ForEach(p =>
                {
                    {
                        Incidence incidence = new()
                        {
                            Name = p.Name,
                            FeedBack = p.FeedBack,
                            DateReported = p.DateReported,
                            incidenceDate = p.incidenceDate,
                            incidencetime = p.incidencetime,
                            Department = p.Department,
                            Departmentfloor = p.Departmentfloor,
                            Cellphone = p.Cellphone,
                            Extension = p.Extension,
                            RoleID = p.RoleID
                        };
                        _context.Incidences.Add(incidence);
                        _context.SaveChanges();
                    }
                });
            }
            return Json(new { data = _context.Incidences });
        }
    }
}