using HSMINET.Interface;
using Repository;
using System.Linq;
using System.Linq.Dynamic.Core;

namespace HSMINET.Repository
{
    public class RolesConcrete : IRoles
    {
        private readonly ApplicationDbContext _context;

        public RolesConcrete(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="RoleName"></param>
        /// <returns></returns>
        public int GetRolesOfUsersByRoleName(string RoleName)
        {
            var RoleID = (from role in _context.Roles
                          where role.RoleName == RoleName
                          select role.RoleID).SingleOrDefault();
            return RoleID;
        }
    }
}