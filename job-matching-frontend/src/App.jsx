import { useState } from "react";

export default function App() {
  // Form and state
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [usState, setUsState] = useState("");
  const [locationType, setLocationType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [salary, setSalary] = useState(90000);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const resultsPerPage = 10;

  // Filters
  const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];
  const locationTypes = ["In-person", "Remote", "Hybrid"];
  const employmentTypes = ["Full-time", "Part-time", "Internship"];
  const jobTitles = [
    "Software Engineer", "Data Scientist", "Product Manager", "UX Designer", "DevOps Engineer", "Frontend Developer",
    "Backend Developer", "AI Researcher", "Cloud Architect", "Cybersecurity Analyst", "Marketing Manager",
    "Sales Executive", "Operations Analyst", "Graphic Designer", "Financial Analyst", "HR Specialist", "Technical Writer",
    "Support Engineer", "Recruiter", "Business Analyst"
  ];

  // Fetch paginated matches
  const fetchMatches = async (requestedPage = page) => {
    setLoading(true);
    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append("resume", file);
        formData.append("salary", salary);
        if (locationType) formData.append("location_type", locationType);
        if (employmentType) formData.append("employment_type", employmentType);
        if (jobTitle) formData.append("title", jobTitle);
        if (usState) formData.append("us_state", usState);
        formData.append("page", requestedPage);
        formData.append("page_size", resultsPerPage);
        response = await fetch("http://localhost:8000/upload-match", {
          method: "POST",
          body: formData,
        });
      } else {
        const filterObj = {};
        if (usState) filterObj.us_state = usState;
        if (locationType) filterObj.location_type = locationType;
        if (employmentType) filterObj.employment_type = employmentType;
        if (jobTitle) filterObj.title = jobTitle;
        filterObj.salary = { "$gte": salary };
        const params = new URLSearchParams({ page: requestedPage, page_size: resultsPerPage });
        response = await fetch(`http://localhost:8000/match?${params.toString()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, top_k: 100, filter: filterObj }),
        });
      }
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setJobs(data.results);
      setTotalResults(data.total);
      setPage(requestedPage);
    } catch (err) {
      console.error("Match error:", err);
      alert("Failed to fetch matches. Please make sure the backend is running on localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  // Tag suggestions (for display)
  const getTagsFromTitle = (title) => {
    const allTags = {
      "Software Engineer": ["React", "Node.js", "JavaScript", "Python", "AWS"],
      "Data Scientist": ["Python", "Machine Learning", "SQL", "TensorFlow", "Pandas"],
      "Product Manager": ["Strategy", "Analytics", "Agile", "Roadmapping", "Stakeholder Management"],
      "UX Designer": ["Figma", "Design Systems", "User Research", "Prototyping", "Wireframing"],
      "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Infrastructure"]
    };
    for (const [role, tags] of Object.entries(allTags)) {
      if (title.toLowerCase().includes(role.toLowerCase())) {
        return tags.slice(0, 3);
      }
    }
    return ["Technology", "Innovation", "Growth"];
  };

  const getScoreColor = (score) => {
    if (score >= 0.9) return { color: '#059669', backgroundColor: '#ecfdf5' };
    if (score >= 0.8) return { color: '#2563eb', backgroundColor: '#eff6ff' };
    if (score >= 0.7) return { color: '#d97706', backgroundColor: '#fffbeb' };
    return { color: '#6b7280', backgroundColor: '#f9fafb' };
  };

  const maxPage = Math.max(1, Math.ceil(totalResults / resultsPerPage));

  // Event handlers
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > maxPage) return;
    setSearchAttempted(true);
    fetchMatches(newPage);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchAttempted(true);
    fetchMatches(1);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoContainer}>
            <span style={styles.logoText}>JobMatcher AI</span>
            <span style={styles.logoIcon}>💼</span>
          </div>
          <h1 style={styles.title}>
            Find your perfect career match with AI-powered recommendations
          </h1>
          <p style={styles.subtitle}>
            Upload your resume and set your job preferences to discover top opportunities!
          </p>
        </div>
      </header>
      <main style={styles.main}>
        <form onSubmit={handleSubmit} style={styles.formCard}>
          {/* Resume Upload */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Upload your resume (PDF or DOCX)</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={e => setFile(e.target.files[0])}
              style={{ display: "none" }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={styles.fileUpload}>
              <div>
                <span style={styles.uploadIcon}>📄</span>
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {file ? file.name : "Click to upload PDF or DOCX"}
                </span>
              </div>
            </label>
          </div>

          {/* US State */}
          <div style={styles.inputGroup}>
            <label style={styles.labelWithIcon}><span style={styles.icon}>📍</span>US State</label>
            <select
              style={styles.select}
              value={usState}
              onChange={e => setUsState(e.target.value)}
            >
              <option value="">Any</option>
              {usStates.map(state =>
                <option key={state} value={state}>{state}</option>
              )}
            </select>
          </div>

          {/* Location Type */}
          <div style={styles.inputGroup}>
            <label style={styles.labelWithIcon}><span style={styles.icon}>🗺️</span> Location Type</label>
            <select
              style={styles.select}
              value={locationType}
              onChange={e => setLocationType(e.target.value)}
            >
              <option value="">Any</option>
              {locationTypes.map(type =>
                <option key={type} value={type}>{type}</option>
              )}
            </select>
          </div>

          {/* Employment Type */}
          <div style={styles.inputGroup}>
            <label style={styles.labelWithIcon}><span style={styles.icon}>💼</span> Employment Type</label>
            <select
              style={styles.select}
              value={employmentType}
              onChange={e => setEmploymentType(e.target.value)}
            >
              <option value="">Any</option>
              {employmentTypes.map(type =>
                <option key={type} value={type}>{type}</option>
              )}
            </select>
          </div>

          {/* Job Title */}
          <div style={styles.inputGroup}>
            <label style={styles.labelWithIcon}><span style={styles.icon}>👑</span> Job Title</label>
            <select
              style={styles.select}
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            >
              <option value="">Any</option>
              {jobTitles.map(title =>
                <option key={title} value={title}>{title}</option>
              )}
            </select>
          </div>

          {/* Minimum Salary */}
          <div style={styles.inputGroup}>
            <label style={styles.labelWithIcon}><span style={styles.icon}>💰</span> Minimum Salary (${salary.toLocaleString()})</label>
            <input
              type="range"
              min="30000"
              max="200000"
              step="5000"
              value={salary}
              onChange={e => setSalary(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading && <span style={styles.spinner} />} Find My Matches
          </button>
        </form>
        {/* JOB RESULTS */}
        <section>
          {loading ? (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <span style={styles.spinner}></span> Finding your match...
            </div>
          ) : (
            <>
              {jobs && jobs.length > 0 ? (
                <>
                  <h2 style={{ textAlign: 'center', margin: '2rem 0 1rem', fontWeight: 600 }}>
                    Showing {jobs.length} of {totalResults} matches
                  </h2>
                  {jobs.map((job, idx) => (
                    <div key={job.id || idx} style={styles.jobCard}>
                      <div style={styles.jobHeader}>
                        <div>
                          <div style={styles.jobTitle}>{job.title}</div>
                          <div style={styles.jobCompany}>{job.tags && job.tags.join(", ")}</div>
                        </div>
                        <div style={styles.scoreContainer}>
                          <div style={{ ...styles.scoreBadge, ...getScoreColor(job.score) }}>
                            Match: {(job.score * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div style={styles.jobDetails}>
                        <div><b>Location:</b> {job.location}</div>
                        {job.us_state && <div><b>State:</b> {job.us_state}</div>}
                        <div><b>Salary:</b> ${job.salary}</div>
                        {job.location_type && (
                          <div style={styles.locationTypeBadge}>{job.location_type}</div>
                        )}
                        {job.employment_type && (
                          <div style={styles.badge}>{job.employment_type}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* PAGINATION */}
                  <div style={styles.pagination}>
                    <button
                      style={styles.pageButton}
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >⬅ Prev</button>
                    {[...Array(maxPage).keys()].map((i) => (
                      <button
                        key={i + 1}
                        style={
                          page === i + 1
                            ? { ...styles.pageNumber, ...styles.activePageNumber }
                            : styles.pageNumber
                        }
                        onClick={() => handlePageChange(i + 1)}
                        disabled={page === i + 1}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      style={styles.pageButton}
                      disabled={page >= maxPage}
                      onClick={() => handlePageChange(page + 1)}
                    >Next ➡</button>
                  </div>
                </>
              ) : searchAttempted ? (
                <div style={{ textAlign: 'center', margin: '1.5rem 0', fontSize: '1.1rem', color: '#6b7280' }}>
                  No matches found for your criteria.<br />
                  <span style={{ color: "#a1a1aa", fontSize: "0.95em" }}>
                    Try broadening your filters or lowering your minimum salary.
                  </span>
                </div>
              ) : (
                <div style={{ textAlign: 'center', margin: '1.5rem 0', fontSize: '1.1rem', color: '#6b7280' }}>
                  Please upload your resume to get started
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}


const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #f3e8ff 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '2rem 1.5rem'
  },
  headerContent: {
    maxWidth: '64rem',
    margin: '0 auto',
    textAlign: 'center'
  },
  logoContainer: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    borderRadius: '1rem',
    padding: '0.5rem 1rem',
    marginBottom: '1rem'
  },
  logoText: {
    color: 'white',
    fontSize: '2.5rem',
    fontWeight: '600'
  },
  logoIcon: {
    fontSize: '2.5rem',
    color: 'white',
    fontWeight: 'bold'
  },
  title: {
    fontSize: '1.50rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '1.125rem'
  },
  main: {
    maxWidth: '64rem',
    margin: '0 auto',
    padding: '2rem 1.5rem'
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    padding: '2rem',
    marginBottom: '2rem'
  },
  inputGroup: { marginBottom: '1.5rem' },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem'
  },
  fileUpload: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    boxSizing: 'border-box', 
    border: '2px dashed #d1d5db',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    backgroundColor: '#fafafa'
  },
  uploadIcon: {
    fontSize: '5rem',
    marginBottom: '0.5rem',
    display: 'block'
  },
  select: {
    width: '100%',
    border: '2px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1rem',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'5\'><path fill=\'%23666\' d=\'M2 0L0 2h4zm0 5L0 3h4z\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center'
  },
  button: {
    width: '100%',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    fontWeight: '600',
    fontSize: '1.125rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s'
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    padding: '1.5rem',
    marginBottom: '1rem',
    transition: 'all 0.3s'
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  jobTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.25rem'
  },
  jobCompany: {
    color: '#4f46e5',
    fontWeight: '500',
    marginBottom: '0.5rem'
  },
  jobDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.75rem',
    flexWrap: 'wrap'
  },
  badge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  locationTypeBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  scoreContainer: { textAlign: 'right' },
  scoreBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '2rem',
    flexWrap: 'wrap'
  },
  pageButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  pageNumber: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.5rem',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  activePageNumber: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: '1px solid #4f46e5'
  },
  spinner: {
    width: '1.25rem',
    height: '1.25rem',
    border: '2px solid white',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};
