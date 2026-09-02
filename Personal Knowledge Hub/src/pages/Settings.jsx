// components
import ModelConfiguration from "../components/ModelConfiguration";
import BackendOverview from "../components/BackendOverview";
import AppDetails from "../components/AppDetails";

export default function Settings() {
    return (
        <>
            <div>
                <ModelConfiguration />
                <BackendOverview />
                <AppDetails />
            </div>
        </>
    )
}
