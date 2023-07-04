using HSMINET.Models;
using System.Collections.Generic;

namespace HSMINET.Interface
{
    public interface IAssignTickets
    {
        public List<AdminModel> ListOfAgents();

        public List<Tickets> ListofTickets();

        List<Tickets> GetListofUnAssignedTickets();

        bool CheckIsUserAssignedTicket(int RegistrationID);

        bool SaveAssignedTickets(AssignTicketsModel assignTicketsModel);
    }
}