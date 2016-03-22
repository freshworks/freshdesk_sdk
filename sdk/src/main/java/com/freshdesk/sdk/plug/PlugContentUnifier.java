package com.freshdesk.sdk.plug;

import com.freshdesk.sdk.ManifestContents;
import com.freshdesk.sdk.TemplateRendererSdk;
import com.freshdesk.sdk.plug.run.ScssCompiler;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;
import org.wiztools.commons.FileUtil;

/**
 *
 * @author raghav
 */
public class PlugContentUnifier {
    
    private final File htmlFile;
    private final File scssFile;
    private final File cssFile;
    private final File jsFile;
    private final ManifestContents manifest;
    private final File prjDir;
    private final File workDir;
    private final Map<String, Object> renderParams;
    public static final String workDirName = "work";
    private static final String cssFileName = "app.css";
    private static PlugExecutionContext ctx;

    public PlugContentUnifier(File appDir, 
            ManifestContents mf, 
            Map<String, Object> renderParams, 
            PlugExecutionContext ctx) {
        htmlFile = new File(appDir, AppFile.toString(AppFile.HTML));
        scssFile = new File(appDir, AppFile.toString(AppFile.SCSS));
        jsFile = new File(appDir, AppFile.toString(AppFile.JS));
        prjDir = appDir.getParentFile();
        workDir = new File(prjDir, workDirName);
        this.manifest = mf;
        this.renderParams = renderParams;
        this.cssFile = new File(workDir, cssFileName);
        this.ctx = ctx;
    }
    
    public String getFileContent(File f) throws IOException {
        return FileUtil.getContentAsString(f, manifest.getCharset());
    }
    
    public String getPlugResponse() throws IOException {
        StringBuilder output = new StringBuilder();

        // For CSS:
        String liqParsedScss = parseLiquids(getScssContent());
        if(!workDir.isDirectory()) {
            workDir.mkdirs();
        }

        File tmpFile = File.createTempFile("fa_", "_app.scss", workDir);
        OutputStream os = new FileOutputStream(tmpFile);
        os.write(liqParsedScss.getBytes());
        os.close();
        
        if(ctx == PlugExecutionContext.RUN) {
            if(FileLastModifiedMonitor.getLastModified() == null) {
                FileLastModifiedMonitor.setLastModified(scssFile);
            }
            if (FileLastModifiedMonitor.getLastModified() < scssFile.lastModified() || !cssFile.isFile()) {
                compileCss(tmpFile, cssFile);
                FileLastModifiedMonitor.setLastModified(scssFile);
            }
        }
        
        else if (ctx == PlugExecutionContext.PACKAGE) {
            compileCss(tmpFile, cssFile);
        }
        
        String css = appendStyleTag(getFileContent(cssFile));
        output.append(css);
        
        // Delete the tmpFile:
        tmpFile.delete();

        // For HTML:
        output.append("\n")
            .append(getHtmlContent());

        // For JS:
        output.append(appendScriptTag(appendFreshappRunTag(getJsContent())));
        return output.toString();
    }

    private String appendStyleTag(String cssContent) {
        return new StringBuilder().append("<style>\n")
            .append(cssContent).append("\n</style>\n").toString();
    }

    private String appendScriptTag(String jsContent) {
        return new StringBuilder().append("<script type='text/javascript'>\n")
            .append(jsContent)
            .append("\n</script>").toString();
    }

    private String appendFreshappRunTag(String content) {
        return new StringBuilder().append("Freshapp.run(function() { \n var {{app_id}} = ")
            .append(content)
            .append("\n{{app_id}}.initialize(); \n});\n").toString();
    }
    
    private String getHtmlContent() throws IOException {
        return getFileContent(htmlFile);
    }

    private String getScssContent() throws IOException {
        return getFileContent(scssFile);
    }

    private String getJsContent() throws IOException {
        return getFileContent(jsFile);
    }

    private void compileCss(File inputFile, File outputFile) {
        new ScssCompiler(inputFile, outputFile).compile();
    }

    private String parseLiquids(String content) {
        TemplateRendererSdk renderer =  new TemplateRendererSdk().registerFilter(new FilterAssetURLPlug(prjDir));
        return renderer.renderString(content, renderParams);
    }
}
