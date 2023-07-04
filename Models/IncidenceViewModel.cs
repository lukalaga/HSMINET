using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSMINET.Models
{
    [NotMapped]
    public class IncidenceViewModel
    {
        public int Notifications_Id { get; set; }

        public string Name { get; set; }

        public string FeedBack { get; set; }

        public string DateReported { get; set; }

        public DateTime incidenceDate { get; set; }

        public string incidencetime { get; set; }

        public string Department { get; set; }

        public string Departmentfloor { get; set; }

        public string Cellphone { get; set; }

        public string Extension { get; set; }

        public int? RoleID { get; set; }
        public int TicketUser { get; set; }

        public string Response { get; set; }
    }
}