using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSMINET.Models
{
    public class AssignTicketsModel
    {

        public List<bool> Checklist { get; set; }
        public AssignTicketsModel()
        {
            TicketList = new List<Tickets>();
            Checklist = new List<bool>(TicketList.Count);
            for(int i = 0;i < TicketList.Count;i++)
            {
                Checklist.Add(false);
            }
        }

        public List<AdminModel> AdminList { get; set; }
        public List<Tickets> TicketList { get; set; }

        public int RegistrationID { get; set; }
        public string Name { get; set; }
        public int AdminCreated { get; set; }
        public string CreatedBy { get; set; }
        public int TicketUser { get; set; }

    }

    [NotMapped]
    public class AdminModel //Agents
    {
        public int RegistrationID { get; set; }

        public string Name { get; set; }

        public string Email { get; set; }
        public bool SelectedAdmins { get; set; }
    }

    [NotMapped]
    public class Tickets
    {
        public int Notifications_Id { get; set; }

        public string Name { get; set; }

        public string FeedBack { get; set; }

        public string DateReported { get; set; }
        public string Departmentfloor { get; set; }

        public string Extension { get; set; }

        public int RoleID { get; set; }
        public bool SelectedTickets { get; set; }
        public string AssignToAdmin { get; set; }
    }
}