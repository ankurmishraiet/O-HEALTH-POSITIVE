
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlogManagement from "../../components/admin/Blog/BlogManagement";
import {
    getContacts,
    updateContactStatus,
    deleteContact,
} from "../../services/contactService";
import MonthyPrograms from "./monthly/MonthlyPrograms"
import ManageOrders from "./manageOrders/ManageOrders";
import VendorNominations from "./vendor/vendorNomination/VendorNomination"
import AdminCampaigns from "./campaign/AdminCampaign";
import VolunteersSection from "./Voluenteer/Voluenteer";
import ManageVendors from "./vendor/ManageVendors";
import ImpactStatistics from "./impact/ImpactStatistics"
import "./AdminDashboard.css";
import logo from "../../assets/logo.jpeg"

const STATUSES = ["Pending", "In Progress", "Resolved"];

function AdminDashboard() {
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState("enquiries");

    // Admin
    const [adminUser, setAdminUser] = useState(() => {
        try {
            return JSON.parse(
                sessionStorage.getItem("adminUser") || "null"
            );
        } catch {
            return null;
        }
    });

    // Enquiries
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    const [updatingId, setUpdatingId] = useState("");
    const [deletingId, setDeletingId] = useState("");
    const [selectedContact, setSelectedContact] = useState(null);

    // Load enquiries
    const loadContacts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getContacts();

            const list = Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result)
                ? result
                : [];

            setContacts(list);
        } catch (err) {
            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                sessionStorage.removeItem("adminToken");
                sessionStorage.removeItem("adminUser");
                navigate("/admin/login", { replace: true });
                return;
            }

            setError(
                err.response?.data?.message ||
                    "Unable to load enquiries. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Authentication
    useEffect(() => {
        const token = sessionStorage.getItem("adminToken");

        if (!token) {
            navigate("/admin/login", { replace: true });
            return;
        }

        loadContacts();
    }, [navigate, loadContacts]);

    // Refresh admin details from session
    useEffect(() => {
        try {
            setAdminUser(
                JSON.parse(sessionStorage.getItem("adminUser") || "null")
            );
        } catch {
            setAdminUser(null);
        }
    }, []);

    // Enquiry counts
    const counts = useMemo(
        () => ({
            total: contacts.length,

            pending: contacts.filter(
                (item) => (item.status || "Pending") === "Pending"
            ).length,

            inProgress: contacts.filter(
                (item) => item.status === "In Progress"
            ).length,

            resolved: contacts.filter(
                (item) => item.status === "Resolved"
            ).length,
        }),
        [contacts]
    );

    // Search and status filtering
    const filteredContacts = useMemo(() => {
        const term = search.trim().toLowerCase();

        return contacts.filter((contact) => {
            const matchesStatus =
                statusFilter === "All" ||
                (contact.status || "Pending") === statusFilter;

            const searchableFields = [
                contact.name,
                contact.email,
                contact.phone,
                contact.subject,
                contact.message,
            ];

            const matchesSearch = searchableFields.some((value) =>
                String(value || "").toLowerCase().includes(term)
            );

            return matchesStatus && matchesSearch;
        });
    }, [contacts, search, statusFilter]);

    // Update enquiry status
    const handleStatusChange = async (id, status) => {
        setUpdatingId(id);
        setActionError("");

        try {
            const result = await updateContactStatus(id, status);

            const updatedContact = result?.data;

            setContacts((current) =>
                current.map((contact) =>
                    contact._id === id
                        ? {
                              ...contact,
                              ...(updatedContact || {}),
                              status:
                                  updatedContact?.status || status,
                          }
                        : contact
                )
            );

            setSelectedContact((current) =>
                current?._id === id
                    ? {
                          ...current,
                          ...(updatedContact || {}),
                          status: updatedContact?.status || status,
                      }
                    : current
            );
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                    "Unable to update enquiry status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    // Delete enquiry
    const handleDelete = async (contact) => {
        const confirmed = window.confirm(
            `Delete the enquiry from ${contact.name}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(contact._id);
        setActionError("");

        try {
            await deleteContact(contact._id);

            setContacts((current) =>
                current.filter((item) => item._id !== contact._id)
            );

            setSelectedContact((current) =>
                current?._id === contact._id ? null : current
            );
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                    "Unable to delete this enquiry."
            );
        } finally {
            setDeletingId("");
        }
    };

    // Logout
    const handleLogout = () => {
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        navigate("/admin/login", { replace: true });
    };

    // Date formatting
    const formatDate = (date) => {
        if (!date) return "—";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return "—";

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <main className="admin-dashboard">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="dashboard-brand">
  <img
    src={logo}
    alt="O Positive Health logo"
    className="dashboard-logo"
  />

  <div>
    <h2>O Positive</h2>
    <p>HEALTH FOUNDATION</p>
  </div>
</div>

                <div className="dashboard-nav-label">
                    WORKSPACE
                </div>

                <button
                    type="button"
                    className={`dashboard-nav-item ${
                        activeSection === "enquiries" ? "active" : ""
                    }`}
                    onClick={() => setActiveSection("enquiries")}
                >
                    <span aria-hidden="true">▦</span>
                    Enquiries
                </button>

                <button
                    type="button"
                    className={`dashboard-nav-item ${
                        activeSection === "volunteers" ? "active" : ""
                    }`}
                    onClick={() => setActiveSection("volunteers")}
                >
                    <span aria-hidden="true">♧</span>
                    Volunteers
                </button>
                <button
  type="button"
  className={`dashboard-nav-item ${
    activeSection === "blogs" ? "active" : ""
  }`}
  onClick={() => setActiveSection("blogs")}
>
  <span aria-hidden="true">✎</span>
  Blogs
</button>
<button
  type="button"
  className={`dashboard-nav-item ${
    activeSection === "campaigns" ? "active" : ""
  }`}
  onClick={() => setActiveSection("campaigns")}
>
  <span aria-hidden="true">♡</span>
  Campaigns
</button>
<button
  type="button"
  className={`dashboard-nav-item ${
    activeSection === "vendors" ? "active" : ""
  }`}
  onClick={() => setActiveSection("vendors")}
>
  <span aria-hidden="true">♧</span>
  Manage Vendors
</button>
<button
  type="button"
  className={`dashboard-nav-item ${
    activeSection === "vendor-nominations" ? "active" : ""
  }`}
  onClick={() => setActiveSection("vendor-nominations")}
>
  <span aria-hidden="true">▤</span>
  Vendor Nominations
</button>
<button
  type="button"
  className={`dashboard-nav-item ${
    activeSection === "monthly-programs" ? "active" : ""
  }`}
  onClick={() => setActiveSection("monthly-programs")}
>
  <span aria-hidden="true">♡</span>
  Monthly Programs
</button>

<button
  type="button"
  className={`dashboard-nav-item ${
    activeSection === "impact-statistics" ? "active" : ""
  }`}
  onClick={() => setActiveSection("impact-statistics")}
>
  <span aria-hidden="true">↗</span>
  Impact Statistics
</button>

<button
  type="button"
  className={`dashboard-nav-item ${
    activeSection === "orders" ? "active" : ""
  }`}
  onClick={() => setActiveSection("orders")}
>
    <span aria-hidden="true">↗</span>
  Manage Orders
</button>


                <div className="dashboard-sidebar-bottom">
                    <div className="dashboard-admin-avatar">
                        {(adminUser?.name || "Admin")
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="dashboard-admin-info">
                        <strong>
                            {adminUser?.name || "Administrator"}
                        </strong>
                        <span>Admin account</span>
                    </div>

                    <button
                        type="button"
                        className="dashboard-logout-icon"
                        onClick={handleLogout}
                        aria-label="Log out"
                        title="Log out"
                    >
                        ↗
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <section className="admin-dashboard-main">
                {/* ENQUIRIES SECTION */}
                {/* CAMPAIGNS SECTION */}
{activeSection === "campaigns" && (
  <AdminCampaigns />
)}
{activeSection === "vendors" && <ManageVendors />}
{activeSection === "vendor-nominations" && (
  <VendorNominations />
)}
{activeSection === "monthly-programs" && (
  <MonthyPrograms />
)}
{activeSection === "impact-statistics" && (
  <ImpactStatistics />
)}

{activeSection === "orders" && <ManageOrders />}

                {activeSection === "blogs" && <BlogManagement />}
                {activeSection === "enquiries" && (
                    <>
                        <header className="dashboard-topbar">
                            <div>
                                <span className="dashboard-breadcrumb">
                                    Workspace / Enquiries
                                </span>

                                <h1>Enquiry Management</h1>
                            </div>

                            <button
                                type="button"
                                className="dashboard-logout-button"
                                onClick={handleLogout}
                            >
                                Log out <span aria-hidden="true">↗</span>
                            </button>
                        </header>

                        <div className="dashboard-welcome">
                            <div>
                                <h2>
                                    Welcome back
                                    {adminUser?.name
                                        ? `, ${adminUser.name}`
                                        : ""}
                                    !
                                </h2>

                                <p>
                                    Review and manage healthcare
                                    enquiries in one place.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="dashboard-refresh-button"
                                onClick={loadContacts}
                                disabled={loading}
                            >
                                ↻ {loading ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>

                        {/* Statistics */}
                        <section
                            className="dashboard-stats"
                            aria-label="Enquiry summary"
                        >
                            <article className="dashboard-stat-card total">
                                <div className="dashboard-stat-icon">
                                    ▤
                                </div>
                                <p>Total enquiries</p>
                                <strong>{counts.total}</strong>
                                <span>All submitted enquiries</span>
                            </article>

                            <article className="dashboard-stat-card pending">
                                <div className="dashboard-stat-icon">
                                    ◷
                                </div>
                                <p>Pending</p>
                                <strong>{counts.pending}</strong>
                                <span>Awaiting action</span>
                            </article>

                            <article className="dashboard-stat-card progress">
                                <div className="dashboard-stat-icon">
                                    ↻
                                </div>
                                <p>In progress</p>
                                <strong>{counts.inProgress}</strong>
                                <span>Currently being handled</span>
                            </article>

                            <article className="dashboard-stat-card resolved">
                                <div className="dashboard-stat-icon">
                                    ✓
                                </div>
                                <p>Resolved</p>
                                <strong>{counts.resolved}</strong>
                                <span>Successfully completed</span>
                            </article>
                        </section>

                        {/* Enquiries panel */}
                        <section className="dashboard-contacts-panel">
                            <div className="dashboard-panel-heading">
                                <div>
                                    <h2>Contact enquiries</h2>
                                    <p>
                                        View and manage requests received
                                        through your website.
                                    </p>
                                </div>

                                <span className="dashboard-result-count">
                                    {filteredContacts.length} records
                                </span>
                            </div>

                            {/* Search and filter */}
                            <div className="dashboard-filters">
                                <div className="dashboard-search">
                                    <span aria-hidden="true">⌕</span>

                                    <input
                                        type="search"
                                        placeholder="Search name, email, subject..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        aria-label="Search enquiries"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    aria-label="Filter by status"
                                    className="dashboard-status-filter"
                                >
                                    <option value="All">
                                        All statuses
                                    </option>

                                    {STATUSES.map((status) => (
                                        <option
                                            key={status}
                                            value={status}
                                        >
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {actionError && (
                                <div
                                    className="dashboard-error"
                                    role="alert"
                                >
                                    {actionError}
                                </div>
                            )}

                            {error && (
                                <div
                                    className="dashboard-error"
                                    role="alert"
                                >
                                    <p>{error}</p>

                                    <button
                                        type="button"
                                        onClick={loadContacts}
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {/* Loading and empty states */}
                            {!error && loading ? (
                                <div className="dashboard-empty-state">
                                    Loading enquiries...
                                </div>
                            ) : !error &&
                              filteredContacts.length === 0 ? (
                                <div className="dashboard-empty-state">
                                    <span aria-hidden="true">▤</span>

                                    <h3>
                                        {contacts.length
                                            ? "No matching enquiries"
                                            : "No enquiries yet"}
                                    </h3>

                                    <p>
                                        {contacts.length
                                            ? "Try a different search term or status filter."
                                            : "New website contact requests will appear here."}
                                    </p>
                                </div>
                            ) : (
                                !error && (
                                    <div className="dashboard-table-wrapper">
                                        <table className="dashboard-table">
                                            <thead>
                                                <tr>
                                                    <th>CONTACT</th>
                                                    <th>SUBJECT & MESSAGE</th>
                                                    <th>DATE</th>
                                                    <th>STATUS</th>
                                                    <th>ACTIONS</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredContacts.map(
                                                    (contact) => (
                                                        <tr key={contact._id}>
                                                            <td>
                                                                <div className="dashboard-contact-name">
                                                                    <strong>
                                                                        {contact.name ||
                                                                            "—"}
                                                                    </strong>

                                                                    <span>
                                                                        {contact.email ||
                                                                            "—"}
                                                                    </span>

                                                                    <span>
                                                                        {contact.phone ||
                                                                            "—"}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <div className="dashboard-subject">
                                                                    <strong>
                                                                        {contact.subject ||
                                                                            "General enquiry"}
                                                                    </strong>

                                                                    <p>
                                                                        {contact.message ||
                                                                            "No message provided."}
                                                                    </p>
                                                                </div>
                                                            </td>

                                                            <td className="dashboard-date">
                                                                {formatDate(
                                                                    contact.createdAt
                                                                )}
                                                            </td>

                                                            <td>
                                                                <select
                                                                    className={`dashboard-status-select ${String(
                                                                        contact.status ||
                                                                            "Pending"
                                                                    )
                                                                        .toLowerCase()
                                                                        .replace(
                                                                            /\s+/g,
                                                                            "-"
                                                                        )}`}
                                                                    value={
                                                                        STATUSES.includes(
                                                                            contact.status
                                                                        )
                                                                            ? contact.status
                                                                            : "Pending"
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        handleStatusChange(
                                                                            contact._id,
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        updatingId ===
                                                                        contact._id
                                                                    }
                                                                    aria-label={`Update status for ${contact.name}`}
                                                                >
                                                                    {STATUSES.map(
                                                                        (
                                                                            status
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    status
                                                                                }
                                                                                value={
                                                                                    status
                                                                                }
                                                                            >
                                                                                {
                                                                                    status
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>

                                                                {updatingId ===
                                                                    contact._id && (
                                                                    <span className="dashboard-row-note">
                                                                        Saving...
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td>
                                                                <div className="dashboard-action-buttons">
                                                                    <button
                                                                        type="button"
                                                                        className="dashboard-view-button"
                                                                        onClick={() =>
                                                                            setSelectedContact(
                                                                                contact
                                                                            )
                                                                        }
                                                                    >
                                                                        View
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="dashboard-delete-button"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                contact
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deletingId ===
                                                                            contact._id
                                                                        }
                                                                        aria-label={`Delete enquiry from ${contact.name}`}
                                                                    >
                                                                        {deletingId ===
                                                                        contact._id
                                                                            ? "Deleting..."
                                                                            : "Delete"}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </section>

                        <footer className="dashboard-footer">
                            O Positive Health · Care before cure
                        </footer>
                    </>
                )}

                {/* VOLUNTEER SECTION */}
                {activeSection === "volunteers" && (
                    <VolunteersSection />
                )}
            </section>

            {/* ENQUIRY DETAILS MODAL */}
            {selectedContact && (
                <div
                    className="enquiry-modal-overlay"
                    onClick={() => setSelectedContact(null)}
                >
                    <section
                        className="enquiry-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-details-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="enquiry-modal-header">
                            <div>
                                <span className="dashboard-eyebrow">
                                    CONTACT ENQUIRY
                                </span>

                                <h2 id="contact-details-title">
                                    Enquiry Details
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedContact(null)}
                                aria-label="Close enquiry details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="enquiry-modal-body">
                            <p>
                                <strong>Name</strong>
                                <span>
                                    {selectedContact.name || "—"}
                                </span>
                            </p>

                            <p>
                                <strong>Email</strong>
                                <span>
                                    {selectedContact.email || "—"}
                                </span>
                            </p>

                            <p>
                                <strong>Phone</strong>
                                <span>
                                    {selectedContact.phone || "—"}
                                </span>
                            </p>

                            <p>
                                <strong>Subject</strong>
                                <span>
                                    {selectedContact.subject || "—"}
                                </span>
                            </p>

                            <p>
                                <strong>Submitted</strong>
                                <span>
                                    {formatDate(selectedContact.createdAt)}
                                </span>
                            </p>

                            <p>
                                <strong>Status</strong>
                                <span>
                                    {selectedContact.status || "Pending"}
                                </span>
                            </p>

                            <div className="enquiry-message">
                                <strong>Message</strong>
                                <p>
                                    {selectedContact.message ||
                                        "No message provided."}
                                </p>
                            </div>
                        </div>

                        <div className="enquiry-modal-footer">
                            <button
                                type="button"
                                className="dashboard-view-button"
                                onClick={() => setSelectedContact(null)}
                            >
                                Close
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default AdminDashboard;
