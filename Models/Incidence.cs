using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HSMINET.Models
{
    public class Incidence
    {
        [Key]
        public int Notifications_Id { get; set; }

        [Required]
        public string Name { get; set; }

        [DataType(DataType.MultilineText)]
        public string FeedBack { get; set; }

       
        public string DateReported { get; set; }

        [DataType(DataType.DateTime)]
        [Display(Name = "Date of Incidence")]
        [Required]
        public DateTime incidenceDate { get; set; }

        [Display(Name = "Time of Incidence")]
        [Required]
        public string incidencetime { get; set; }

        [DataType(DataType.Text)]
        [Required]
        public string Department { get; set; }

        [Display(Name = "Floor")]
        public string Departmentfloor { get; set; }

        [DataType(DataType.PhoneNumber)]
        public string Cellphone { get; set; }

        [DataType(DataType.PhoneNumber)]
        public string Extension { get; set; }

        public int? RoleID { get; set; }
        public int TicketUser { get; set; }
        public string ClosedBy { get; set; }

        [DataType(DataType.MultilineText)]
        public string Response { get; set; }

        public ICollection<AssignedTickets> AssignedTickets { get; set; }
    }
}