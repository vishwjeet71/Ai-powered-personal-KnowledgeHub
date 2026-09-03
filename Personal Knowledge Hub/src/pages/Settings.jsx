// components
import ModelConfiguration from "../components/ModelConfiguration";
import BackendOverview from "../components/BackendOverview";
import AppDetails from "../components/AppDetails";

export default function Settings() {
    return (
        <div className="page settings-page">
            <header className="page-header">
                <h1 className="page-header__title">Settings</h1>
            </header>

            <div className="settings-page__panels">
                <ModelConfiguration />
                <BackendOverview />
                <AppDetails />
            </div>
        </div>
    )
}
