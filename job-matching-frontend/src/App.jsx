import { useState } from "react";

export default function App() {
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [jobSector, setJobSector] = useState("");
  const [salary, setSalary] = useState(90000);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  const locationTypes = ["In-person", "Remote", "Hybrid"];
  
  const employmentTypes = [
    "Full-time", "Part-time", "Self-employed", "Freelance", "Contract", "Internship", "Apprenticeship"
  ];

  const jobSectors = [
    "Computer Software",
    "Information Technology & Services", 
    "Government Relations",
    "Financial Services",
    "Defense & Space",
    "Hospital & Health Care",
    "Staffing & Recruiting",
    "Management Consulting",
    "Computer & Network Security",
    "Marketing & Advertising",
    "Education",
    "Real Estate",
    "Automotive",
    "Manufacturing",
    "Retail",
    "Entertainment"
  ];

  const resultsPerPage = 5;

  const fetchMatches = async () => {
    setLoading(true);
    try {
      let response;
      
      if (file) {
        // Use file upload endpoint
        const formData = new FormData();
        formData.append("resume", file);
        formData.append("location", location || "Remote");
        formData.append("salary", salary);
        
        // Add new filter parameters
        if (locationType) formData.append("location_type", locationType);
        if (employmentType) formData.append("employment_type", employmentType);
        if (jobSector) formData.append("sector", jobSector);

        response = await fetch("http://localhost:8000/upload-match", {
          method: "POST",
          body: formData,
        });
      } else {
        // Use text query endpoint with enhanced filters
        const filterObj = {
          location: location || "Remote",
          salary: { "$gte": salary }
        };
        
        // Add optional filters
        if (locationType) filterObj.location_type = locationType;
        if (employmentType) filterObj.employment_type = employmentType;
        if (jobSector) filterObj.sector = jobSector;

        response = await fetch("http://localhost:8000/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            top_k: 50,
            filter: filterObj
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the backend data to include additional UI properties
      const enrichedJobs = data.map(job => ({
        ...job,
        company: getCompanyFromTitle(job.title),
        type: getJobType(job.location),
        tags: getTagsFromTitle(job.title)
      }));
      
      setJobs(enrichedJobs);
      setPage(1);
    } catch (err) {
      console.error("Match error:", err);
      alert("Failed to fetch matches. Please make sure the backend is running on localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to enrich job data for better UI
  const getCompanyFromTitle = (title) => {
    const companies = ["TechCorp Inc.", "StartupXYZ", "Design Studios", "InnovateLab", "DataFlow Systems", "CloudTech Solutions", "AI Ventures", "NextGen Software"];
    return companies[Math.floor(Math.random() * companies.length)];
  };

  const getJobType = (location) => {
    if (location.toLowerCase().includes("remote")) return "Remote";
    return Math.random() > 0.5 ? "Full-time" : "Hybrid";
  };

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
        return tags.slice(0, 3); // Return first 3 tags
      }
    }
    return ["Technology", "Innovation", "Growth"];
  };

  const paginatedJobs = jobs.slice(
    (page - 1) * resultsPerPage,
    page * resultsPerPage
  );

  const getScoreColor = (score) => {
    if (score >= 0.9) return { color: '#059669', backgroundColor: '#ecfdf5' };
    if (score >= 0.8) return { color: '#2563eb', backgroundColor: '#eff6ff' };
    if (score >= 0.7) return { color: '#d97706', backgroundColor: '#fffbeb' };
    return { color: '#6b7280', backgroundColor: '#f9fafb' };
  };

  const getScoreStars = (score) => {
    const stars = Math.round(score * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{ color: i < stars ? '#fbbf24' : '#d1d5db' }}
      >
        ⭐
      </span>
    ));
  };

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
      alignItems: 'center',
      justifyContent: 'center',
      width: '4rem',
      height: '4rem',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      borderRadius: '1rem',
      marginBottom: '1rem'
    },
    title: {
      fontSize: '2.25rem',
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
    inputGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.75rem'
    },
    textarea: {
      width: '100%',
      border: '2px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '1rem',
      fontSize: '1rem',
      resize: 'none',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box'
    },
    input: {
      width: '100%',
      border: '2px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '1rem',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box'
    },
    fileUpload: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      border: '2px dashed #d1d5db',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s',
      backgroundColor: '#fafafa'
    },
    uploadIcon: {
      fontSize: '2rem',
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
    rangeContainer: {
      position: 'relative'
    },
    rangeInput: {
      width: '100%',
      height: '0.5rem',
      borderRadius: '0.25rem',
      background: '#e5e7eb',
      outline: 'none',
      appearance: 'none',
      cursor: 'pointer'
    },
    rangeValue: {
      textAlign: 'center',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#4f46e5',
      marginTop: '0.5rem'
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '1.5rem'
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
    buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
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
      fontSize: '1.25rem',
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
    tags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginBottom: '0.75rem'
    },
    tag: {
      padding: '0.25rem 0.75rem',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    scoreContainer: {
      textAlign: 'right'
    },
    scoreBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    applyButton: {
      width: '100%',
      backgroundColor: '#eef2ff',
      color: '#4f46e5',
      padding: '0.75rem',
      borderRadius: '0.75rem',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      marginTop: '2rem'
    },
    pageButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
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

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .hover-shadow:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border-color: #c7d2fe;
          }
          .hover-bg:hover {
            background-color: #f8fafc;
          }
          .hover-upload:hover {
            border-color: #a5b4fc;
            background-color: #eef2ff;
          }
          .focus-input:focus, .focus-select:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          }
          .focus-select:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          }
          .range-input::-webkit-slider-thumb {
            appearance: none;
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .range-input::-moz-range-thumb {
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .hover-button:hover {
            background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
          }
          .hover-apply:hover {
            background-color: #e0e7ff;
          }
        `}
      </style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoContainer}>
            <span style={{ fontSize: '2rem', color: 'white' }}>💼</span>
          </div>
          <h1 style={styles.title}>Job Matcher</h1>
          <p style={styles.subtitle}>Find your perfect career match with AI-powered recommendations</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Search Form */}
        <div style={styles.formCard}>
          {/* Resume Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tell us about yourself</label>
            <textarea
              rows="4"
              style={styles.textarea}
              className="focus-input"
              placeholder="Paste your resume, describe your experience, skills, and career goals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={file !== null}
            />
            {file && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ecfdf5',
                border: '1px solid #bbf7d0',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginTop: '0.75rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#059669' }}>
                  ✓ Using uploaded file: {file.name}
                </span>
                <button
                  onClick={() => setFile(null)}
                  style={{
                    color: '#059669',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Or upload your resume</label>
            <div>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                style={styles.fileUpload}
                className="hover-upload"
              >
                <div>
                  <span style={styles.uploadIcon}>📄</span>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {file ? file.name : "Click to upload PDF or DOCX"}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div style={styles.filterGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <span style={{ marginRight: '0.25rem' }}>📍</span>
                Job Location (US State)
              </label>
              <select
                style={styles.select}
                className="focus-select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select State</option>
                {usStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <span style={{ marginRight: '0.25rem' }}>🏢</span>
                Location Type
              </label>
              <select
                style={styles.select}
                className="focus-select"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
              >
                <option value="">Any Location Type</option>
                {locationTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <span style={{ marginRight: '0.25rem' }}>💼</span>
                Employment Type
              </label>
              <select
                style={styles.select}
                className="focus-select"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
              >
                <option value="">Any Employment Type</option>
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <span style={{ marginRight: '0.25rem' }}>🏭</span>
                Job Sector
              </label>
              <select
                style={styles.select}
                className="focus-select"
                value={jobSector}
                onChange={(e) => setJobSector(e.target.value)}
              >
                <option value="">Any Sector</option>
                {jobSectors.map((sector) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <span style={{ marginRight: '0.25rem' }}>💰</span>
                Minimum Salary: ${salary.toLocaleString()}
              </label>
              <div style={styles.rangeContainer}>
                <input
                  type="range"
                  min="30000"
                  max="200000"
                  step="5000"
                  style={styles.rangeInput}
                  className="range-input"
                  value={salary}
                  onChange={(e) => setSalary(parseInt(e.target.value))}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  <span>$30k</span>
                  <span>$200k</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={fetchMatches}
            disabled={loading || (!query.trim() && !file)}
            style={{
              ...styles.button,
              ...(loading || (!query.trim() && !file) ? styles.buttonDisabled : {})
            }}
            className="hover-button"
          >
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                Searching for matches...
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>🔍</span>
                Find Perfect Matches
              </>
            )}
          </button>
          {!query.trim() && !file && (
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '0.75rem'
            }}>
              Please enter your experience or upload a resume to get started
            </p>
          )}
        </div>

        {/* Results */}
        {jobs.length > 0 && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#eab308' }}>⭐</span>
                Your Matches ({jobs.length} found)
              </h2>
            </div>

            {/* Job Cards */}
            <div>
              {paginatedJobs.map((job) => (
                <div
                  key={job.id}
                  style={styles.jobCard}
                  className="hover-shadow"
                >
                  <div style={styles.jobHeader}>
                    <div style={{ flex: 1 }}>
                      <h3 style={styles.jobTitle}>{job.title}</h3>
                      <p style={styles.jobCompany}>{job.company}</p>
                      <div style={styles.jobDetails}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>📍</span>
                          {job.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>💰</span>
                          ${job.salary.toLocaleString()}
                        </span>
                        <span style={styles.badge}>
                          {job.type}
                        </span>
                      </div>
                      {job.tags && (
                        <div style={styles.tags}>
                          {job.tags.map((tag, index) => (
                            <span key={index} style={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={styles.scoreContainer}>
                      <div style={{
                        ...styles.scoreBadge,
                        ...getScoreColor(job.score)
                      }}>
                        {Math.round(job.score * 100)}% Match
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.125rem',
                        marginTop: '0.5rem',
                        justifyContent: 'flex-end'
                      }}>
                        {getScoreStars(job.score)}
                      </div>
                    </div>
                  </div>
                  <button style={styles.applyButton} className="hover-apply">
                    View Details & Apply
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {jobs.length > resultsPerPage && (
              <div style={styles.pagination}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    ...styles.pageButton,
                    ...(page === 1 ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                  }}
                  disabled={page === 1}
                  className="hover-bg"
                >
                  <span>←</span>
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {Array.from({ length: Math.ceil(jobs.length / resultsPerPage) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      style={{
                        ...styles.pageNumber,
                        ...(page === i + 1 ? styles.activePageNumber : {})
                      }}
                      className={page !== i + 1 ? "hover-bg" : ""}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    ...styles.pageButton,
                    ...(page * resultsPerPage >= jobs.length ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                  }}
                  disabled={page * resultsPerPage >= jobs.length}
                  className="hover-bg"
                >
                  Next
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}