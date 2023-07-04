using HSMINET.Models;
using Microsoft.EntityFrameworkCore;

namespace Repository
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Incidence> Incidences { get; set; }
        public DbSet<AssignedTickets> AssignedTickets { get; set; }
        public DbSet<Roles> Roles { get; set; }
        public DbSet<Registration> Registrations { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.Entity<AssignedTickets>()
               .HasOne(p => p.Incidence)
               .WithMany(b => b.AssignedTickets)
               .HasForeignKey(b => b.Notifications_Id);
        }
    }
}