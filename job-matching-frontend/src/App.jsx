import { useState } from "react";
import axios from "axios";

export default function App() {
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState("Remote");
  const [salary, setSalary] = useState(90000);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const resultsPerPage = 5;

  const fetchMatches = async () => {
    try {
      const formData = new FormData();
      if (file) {
        formData.append("resume", file);
      } else {
        formData.append("query", query);
      }
      formData.append("location", location);
      formData.append("salary", salary);

      const res = await axios.post("http://localhost:8000/upload-match", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setJobs(res.data);
      setPage(1);
    } catch (err) {
      console.error("Match error:", err);
      alert("Failed to fetch matches.");
    }
  };

  const paginatedJobs = jobs.slice(
    (page - 1) * resultsPerPage,
    page * resultsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">Job Matcher</h1>

        <textarea
          rows="4"
          className="w-full border rounded p-2"
          placeholder="Paste your resume or describe your experience..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={file !== null}
        />

        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border rounded p-2"
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            className="flex-1 border rounded p-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
          />
          <input
            type="number"
            className="flex-1 border rounded p-2"
            value={salary}
            onChange={(e) => setSalary(parseInt(e.target.value))}
            placeholder="Minimum Salary"
          />
        </div>

        <button
          onClick={fetchMatches}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Find Matches
        </button>

        <div>
          {paginatedJobs.map((job) => (
            <div key={job.id} className="border rounded p-4 my-2">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <p className="text-sm text-gray-500">{job.location}</p>
              <p className="text-sm text-gray-700">💰 ${job.salary}</p>
              <p className="text-xs text-gray-400 mt-1">Score: {job.score.toFixed(3)}</p>
            </div>
          ))}

          {jobs.length > resultsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={page === 1}
              >
                ⬅️ Prev
              </button>
              <span>Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={page * resultsPerPage >= jobs.length}
              >
                Next ➡️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
