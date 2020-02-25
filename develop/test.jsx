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

