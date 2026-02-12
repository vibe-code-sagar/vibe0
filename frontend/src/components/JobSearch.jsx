export default function JobSearch({
  query,
  location,
  onChangeQuery,
  onChangeLocation,
  onSearch,
  loading,
  disabled,
  experienceLevel,
  onChangeExperienceLevel,
  last24,
  onChangeLast24,
}) {
  return (
    <section>
      <div className="cardHeader">
        <h2 className="cardTitle">Job Search</h2>
        <p className="cardSubTitle">Find roles, then analyze your resume against them.</p>
      </div>

      <form
        className="formGrid"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <div className="searchRow">
          <div className="field searchRow__field">
            <label className="label" htmlFor="role">Role</label>
            <input
              id="role"
              className="input"
              type="text"
              placeholder="e.g. Frontend Developer"
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              autoComplete="off"
              disabled={disabled}
              required
            />
          </div>

          <div className="field searchRow__field">
            <label className="label" htmlFor="location">Location</label>
            <input
              id="location"
              className="input"
              type="text"
              placeholder="e.g. Mumbai (optional)"
              value={location}
              onChange={(e) => onChangeLocation(e.target.value)}
              autoComplete="off"
              disabled={disabled}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="filterRow">
          <div className="field">
            <label className="label" htmlFor="experience">Experience</label>
            <select
              id="experience"
              className="input select"
              value={experienceLevel}
              onChange={(e) => onChangeExperienceLevel(e.target.value)}
              disabled={disabled}
            >
              <option value="">Any</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          <label className="checkboxLabel" htmlFor="last24">
            <input
              id="last24"
              type="checkbox"
              checked={last24}
              onChange={(e) => onChangeLast24(e.target.checked)}
              disabled={disabled}
            />
            <span>Last 24 hours only</span>
          </label>
        </div>

        <div className="actionsRow">
          <button className="btn btnPrimary" type="submit" disabled={disabled || loading}>
            {loading ? (
              <>
                <span className="spinner spinner--sm spinner--white" aria-hidden="true" />
                Searching…
              </>
            ) : (
              'Search Jobs'
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
