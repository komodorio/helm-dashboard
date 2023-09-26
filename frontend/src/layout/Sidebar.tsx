import "../App.css";

function Sidebar(): JSX.Element {
  return (
    <div className="card-left">
      <h2>Repositories</h2>
      <form>
        <div className="options">
          <label>
            <input type="radio" value="" />
            bitnami
          </label>
        </div>
        <div className="options">
          <label>
            <input type="radio" value="" />
            bitnami
          </label>
        </div>
      </form>
      <button className="btn">Add Repository</button>
      <p>Some text that describes chart</p>
    </div>
  );
}

export default Sidebar;
