const changeHandlerHelper = async (e, state, setState, customChangesFn = () => { }) => {
    const prevState = { ...state };
    const { name, value, checked, type, files } = e.target;

    if (type === "number") {
        prevState[name] = Number(value);
    } 
    else if (type === "file") {
        if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                prevState[name] = {
                    preview: reader.result, // base64 image preview
                    extension: file.name.split('.').pop(),
                    path: file.name,
                    file: file,
                };
                customChangesFn(prevState, e.target);
                setState(prevState);
            };

            reader.readAsDataURL(file); // convert to base64 for preview
            return; // prevent calling setState before FileReader completes
        }
    } 
    else {
        prevState[name] = value;
    }

    customChangesFn(prevState, e.target);
    setState(prevState);
};

export default changeHandlerHelper;
