<Modal.Body>
<input
    // The ref attribute adds a reference to the component to
    // this.refs when the component is mounted.
    ref={(node) => {
        this.fileInputEl = node;
    }}
    type="file"
    style={{ display: 'none' }}
    multiple={false}
    onChange={this.which ? this.handleLoadProbingFile : this.handleLoadGcodeFile}
/>

// setFunc = (which) => {
    //     this.which = which;
    //     log.log(INFO, 'AutoLevel/index.jsx handleClickUpload which=' + this.which);
    // }

    handleLoadProbingFile = (event) => {
        log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile which=' + this.which);
        const { actions } = this.props;
        const files = event.target.files;
        const file = files[0];
        const reader = new FileReader();
        reader.onloadend = (event) => {
            const { result, error } = event.target;

            if (error) {
                log.error(error);
                return;
            }

            log.debug('FileReader:', pick(file, [
                'lastModified',
                'lastModifiedDate',
                'meta',
                'name',
                'size',
                'type'
            ]));

            var contents = event.target.result;
            //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile result \n' + contents);
            let lines = contents.split('\n');
            //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile lines \n' + lines);
            //let prbm =
            lines.forEach(line => {
                let la = line.split(' ');
                let pt = {
                    x: parseFloat(la[0]),
                    y: parseFloat(la[1]),
                    z: parseFloat(la[2])
                };
                if (pt.x) {
                    //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile pt.x \n' + JSON.stringify(pt.x));
                    this.probedPoints.push(pt);
                }
            });
            log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile probedPoints \n' + JSON.stringify(this.probedPoints));
        };

        try {
            reader.readAsText(file);
        } catch (err) {
            log.error('ApplyAutoLevel.jsx handleLoadProbingFile error reading file');
        }
    };

    handleLoadGcodeFile = (event) => {
        log.log(INFO, 'ApplyAutoLevel.jsx handleLoadGcodeFilewhich=' + this.which);
        const { actions } = this.props;
        const files = event.target.files;
        const file = files[0];
        const reader = new FileReader();
        reader.onloadend = (event) => {
            const { result, error } = event.target;

            if (error) {
                log.error(error);
                return;
            }

            log.debug('FileReader:', pick(file, [
                'lastModified',
                'lastModifiedDate',
                'meta',
                'name',
                'size',
                'type'
            ]));

            var contents = event.target.result;
            //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadGcodeFile result \n' + contents);
            let lines = contents.split('\n');
            //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadGcodeFile lines \n' + lines);
            //let prbm =
            lines.forEach(line => {
                let la = line.split(' ');
                let pt = {
                    x: parseFloat(la[0]),
                    y: parseFloat(la[1]),
                    z: parseFloat(la[2])
                };
                if (pt.x) {
                    //log.log(INFO, 'AutoLevel/index.jsx handleLoadGcodeFile pt.x \n' + JSON.stringify(pt.x));
                    this.probedPoints.push(pt);
                }
            });
            log.log(INFO, 'ApplyAutoLevel.jsx handleLoadGcodeFile probedPoints \n' + JSON.stringify(this.probedPoints));
        };

        try {
            reader.readAsText(file);
        } catch (err) {
            log.error('ApplyAutoLevel.jsx handleLoadGcodeFile error reading file');
        }
    };
