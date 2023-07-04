using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSMINET.Models
{
    public class AssignedTickets
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        public int AssignToUser { get; set; }
        public string CreatedBy { get; set; }
        public int AdminCreated { get; set; }
        public DateTime? CreatedOn { get; set; }

        public string Status { get; set; }
        public DateTime? ClosedOn { get; set; }

        [DataType(DataType.Time)]
        public string TurnAroundTime { get; set; }

        public string NotificationSent { get; set; }
        public int Notifications_Id { get; set; }
        public  Incidence Incidence { get; set; }
    }
}